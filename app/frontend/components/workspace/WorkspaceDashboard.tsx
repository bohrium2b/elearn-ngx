import {
    Box,
    Chip,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    Menu,
    MenuItem,
    Paper,
    Stack,
    TextField,
    ThemeProvider,
    Typography,
    Pagination,
    Breadcrumbs
} from "@mui/material";
import {
    Add,
    Delete,
    Edit,
    Inbox,
    Menu as MenuIcon,
    MenuOpen,
    NavigateNext,
} from "@mui/icons-material";
import { Colorful } from "@uiw/react-color";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Grid from "@mui/material/Grid";
import { workspaceTheme } from "../islands/workspace-theme";
import type { QuestionNode, TagNode, DragPayload, WorkspaceProps, WorkspaceState } from "./types";
import {
    colorToHex,
    fetchWorkspaceState,
    flattenTags,
    findSelectedTag,
    findSelectedQuestion,
    removeQuestionFromTree,
    addQuestionToTag,
    updateQuestionInTree,
    cloneTree,
    UNTAGGED_TAG,
} from "./utils";
import { EmptyState } from "./EmptyState";
import { SubtagCard } from "./SubtagCard";
import { AddQuestionCard } from "./AddQuestionCard";
import { QuestionCard } from "./QuestionCard";
import { SidebarNode } from "./SidebarNode";
import { QuestionDetailPanel } from "./QuestionDetailPanel";

export const WorkspaceDashboard: React.FC<WorkspaceProps> = ({
    treeData,
    untaggedQuestions,
    refreshPath,
    classifyPath,
    csrfToken,
}) => {
    const [state, setState] = useState<WorkspaceState>({
        treeData: cloneTree(treeData),
        untaggedQuestions: [...untaggedQuestions],
    });
    const [selectedTagUuid, setSelectedTagUuid] = useState<string | null>(treeData[0]?.uuid ?? null);
    const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
    const [expandedTagUuids, setExpandedTagUuids] = useState<Set<string>>(() => new Set());
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [sidebarWidth, setSidebarWidth] = useState(320);
    const [isResizing, setIsResizing] = useState(false);
    const resizeRef = useRef<HTMLDivElement>(null);

    const lastWorkspaceSnapshot = useRef("");
    const [actionsAnchorEl, setActionsAnchorEl] = useState<HTMLElement | null>(null);
    const [slugEditQuestionId, setSlugEditQuestionId] = useState<number | null>(null);
    const [slugDraft, setSlugDraft] = useState<string>("");
    const [isEditingTag, setIsEditingTag] = useState(false);
    const [tagNameDraft, setTagNameDraft] = useState<string>("");
    const [tagSlugDraft, setTagSlugDraft] = useState<string>("");
    const [tagColorDraft, setTagColorDraft] = useState<string>("");
    const [showTagColorPicker, setShowTagColorPicker] = useState(false);
    const [showCreateTagModal, setShowCreateTagModal] = useState(false);
    const [createTagName, setCreateTagName] = useState("");
    const [createTagColor, setCreateTagColor] = useState("");
    const [showCreateColorPicker, setShowCreateColorPicker] = useState(false);
    const [createTagParentId, setCreateTagParentId] = useState<number | null>(null);
    const [showDeleteTagConfirm, setShowDeleteTagConfirm] = useState(false);
    const [editAfterSlugSaveId, setEditAfterSlugSaveId] = useState<number | null>(null);

    useEffect(() => {
        setState({ treeData: cloneTree(treeData), untaggedQuestions: [...untaggedQuestions] });
        setSelectedTagUuid(treeData[0]?.uuid ?? null);
        setSelectedQuestionId(null);
        setExpandedTagUuids(new Set());
    }, [treeData, untaggedQuestions]);

    useEffect(() => {
        const syncWorkspace = async () => {
            const payload = await fetchWorkspaceState(refreshPath);
            if (!payload) return;
            const snapshot = JSON.stringify(payload);
            if (snapshot === lastWorkspaceSnapshot.current) return;

            lastWorkspaceSnapshot.current = snapshot;
            setState({ treeData: cloneTree(payload.treeData), untaggedQuestions: [...payload.untaggedQuestions] });
        };

        void syncWorkspace();
        const intervalId = window.setInterval(() => {
            void syncWorkspace();
        }, 10000);

        return () => window.clearInterval(intervalId);
    }, [refreshPath]);

    const selectedTag = useMemo(() => findSelectedTag(state.treeData, selectedTagUuid), [state.treeData, selectedTagUuid]);
    const selectedQuestion = useMemo(
        () => findSelectedQuestion(state.treeData, state.untaggedQuestions, selectedQuestionId),
        [state.treeData, state.untaggedQuestions, selectedQuestionId],
    );
    const [directQuestionsPage, setDirectQuestionsPage] = useState(1);
    const DIRECT_PER_PAGE = 5;

    useEffect(() => {
        setDirectQuestionsPage(1);
    }, [selectedTagUuid]);

    const createTagParentLabel = useMemo(() => {
        if (createTagParentId == null) return "<root>";
        const found = flattenTags(state.treeData).find((t) => t.id === createTagParentId);
        return found ? found.name : "<unknown>";
    }, [state.treeData, createTagParentId]);

    // Updated: Question click now also selects the parent tag
    const handleQuestionClick = (question: QuestionNode, parentNode: TagNode | null) => {
        setSelectedQuestionId(question.id);
        // Select the parent tag as well (or "untagged" if no parent)
        if (parentNode) {
            setSelectedTagUuid(parentNode.uuid);
            // Expand the parent tag if not already expanded
            if (!expandedTagUuids.has(parentNode.uuid)) {
                setExpandedTagUuids((current) => {
                    const next = new Set(current);
                    next.add(parentNode.uuid);
                    return next;
                });
            }
        } else {
            // For untagged questions, we'll use a special "untagged" UUID
            setSelectedTagUuid("__untagged__");
        }
    };

    const handleQuestionDeleted = (questionId: number) => {
        setSelectedQuestionId((current) => (current === questionId ? null : current));
        void fetchWorkspaceState(refreshPath).then((payload) => {
            if (!payload) return;
            lastWorkspaceSnapshot.current = JSON.stringify(payload);
            setState({ treeData: cloneTree(payload.treeData), untaggedQuestions: [...payload.untaggedQuestions] });
        });
    };

    const handleCreateTag = async (parentId: number | null = null) => {
        setCreateTagName("");
        setCreateTagColor("");
        setCreateTagParentId(parentId ?? null);
        setShowCreateTagModal(true);
    };

    const handleCreateTagSubmit = async () => {
        const name = createTagName?.trim();
        if (!name) return;

        const response = await fetch("/tag", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-Token": csrfToken,
                Accept: "application/json",
            },
            body: JSON.stringify({ tag: { name, color: createTagColor || null, parent_id: createTagParentId } }),
        });

        setShowCreateTagModal(false);
        setCreateTagParentId(null);
        if (!response.ok) return;

        const payload = await fetchWorkspaceState(refreshPath);
        if (!payload) return;

        lastWorkspaceSnapshot.current = JSON.stringify(payload);
        setState({ treeData: cloneTree(payload.treeData), untaggedQuestions: [...payload.untaggedQuestions] });
    };

    const handleCreateQuestion = async () => {
        const genSlug = () => {
            const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
            let out = "question-";
            for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
            return out;
        };

        const slug = genSlug();

        const payload = {
            question: "New question placeholder",
            choices: [
                { content: "Choice A", correct: true },
                { content: "Choice B", correct: false },
            ],
            hints: [],
            numChoices: 1,
            slug,
        };

        const response = await fetch("/questions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-Token": csrfToken,
                Accept: "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) return;

        const workspace = await fetchWorkspaceState(refreshPath);
        if (!workspace) return;

        lastWorkspaceSnapshot.current = JSON.stringify(workspace);
        setState({ treeData: cloneTree(workspace.treeData), untaggedQuestions: [...workspace.untaggedQuestions] });

        const all = [...workspace.untaggedQuestions, ...flattenTags(workspace.treeData).flatMap((node) => node.questions)];
        const created = all.find((q) => q.slug === slug);
        if (created) {
            setSelectedQuestionId(created.id);
            setSlugEditQuestionId(created.id);
            setSlugDraft(slug);
        }
    };

    const handleCreateQuestionInTag = async (targetTagId: number) => {
        const genSlug = () => {
            const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
            let out = "question-";
            for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
            return out;
        };

        const slug = genSlug();

        const payload = {
            question: "New question placeholder",
            choices: [
                { content: "Choice A", correct: true },
                { content: "Choice B", correct: false },
            ],
            hints: [],
            numChoices: 1,
            slug,
        };

        const response = await fetch("/questions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-Token": csrfToken,
                Accept: "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) return;

        const workspace = await fetchWorkspaceState(refreshPath);
        if (!workspace) return;

        lastWorkspaceSnapshot.current = JSON.stringify(workspace);
        setState({ treeData: cloneTree(workspace.treeData), untaggedQuestions: [...workspace.untaggedQuestions] });

        const all = [...workspace.untaggedQuestions, ...flattenTags(workspace.treeData).flatMap((node) => node.questions)];
        const created = all.find((q) => q.slug === slug);
        if (!created) return;

        try {
            const classifyResp = await fetch(classifyPath, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": csrfToken,
                },
                body: JSON.stringify({ question_id: created.id, target_tag_id: targetTagId, source_tag_id: null }),
            });

            if (!classifyResp.ok) return;
        } catch {
            // noop
        }

        const workspace2 = await fetchWorkspaceState(refreshPath);
        if (!workspace2) return;
        lastWorkspaceSnapshot.current = JSON.stringify(workspace2);
        setState({ treeData: cloneTree(workspace2.treeData), untaggedQuestions: [...workspace2.untaggedQuestions] });

        setSelectedQuestionId(created.id);
        setSlugEditQuestionId(created.id);
        setSlugDraft(slug);
    };

    const openActionsMenu = (event: React.MouseEvent<HTMLElement>) => setActionsAnchorEl(event.currentTarget);
    const closeActionsMenu = () => setActionsAnchorEl(null);

    const handleDeleteTag = async (deletePath: string) => {
        setShowDeleteTagConfirm(true);
        performDeleteTag.current = async () => {
            const response = await fetch(deletePath, { method: "DELETE", headers: { "X-CSRF-Token": csrfToken } });
            if (response.ok) {
                window.location.href = "/";
            }
        };
    };

    const performDeleteTag = useRef<(() => Promise<void>) | null>(null);

    const handleModifyTag = async () => {
        if (!selectedTag) return;
        setIsEditingTag(true);
        setTagNameDraft(selectedTag.name || "");
        setTagSlugDraft(selectedTag.slug?.replace(/^tag-/, "") || "");
        setTagColorDraft(selectedTag.color || "");
    };

    const handleCancelEditTag = () => {
        setIsEditingTag(false);
        setTagNameDraft("");
        setTagSlugDraft("");
        setTagColorDraft("");
    };

    const handleSaveEditTag = async () => {
        if (!selectedTag) return;
        const slug = `tag-${String(tagSlugDraft || selectedTag.slug || "").trim().replace(/[^a-z0-9-]/gi, "-").toLowerCase()}`;
        const response = await fetch(selectedTag.permalink, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-Token": csrfToken,
                Accept: "application/json",
            },
            body: JSON.stringify({ tag: { name: tagNameDraft.trim(), slug, color: tagColorDraft || null } }),
        });

        if (!response.ok) {
            window.alert("Failed to update tag");
            return;
        }

        const workspace = await fetchWorkspaceState(refreshPath);
        if (!workspace) return;

        lastWorkspaceSnapshot.current = JSON.stringify(workspace);
        setState({ treeData: cloneTree(workspace.treeData), untaggedQuestions: [...workspace.untaggedQuestions] });
        setIsEditingTag(false);
    };

    const handleQuestionDragStart = (_payload: DragPayload) => undefined;

    const handleTagDrop = async (targetTagId: number, payload: DragPayload) => {
        if (payload.sourceTagId === targetTagId) return;

        const previousState = state;
        const question =
            previousState.untaggedQuestions.find((item) => item.id === payload.questionId) ||
            flattenTags(previousState.treeData)
                .flatMap((node) => node.questions)
                .find((item) => item.id === payload.questionId);

        if (!question) return;

        setState((current) => ({
            treeData: addQuestionToTag(
                removeQuestionFromTree(current.treeData, payload.questionId, payload.sourceTagId),
                targetTagId,
                { ...question, source_tag_id: targetTagId },
            ),
            untaggedQuestions: current.untaggedQuestions.filter((item) => item.id !== payload.questionId),
        }));

        try {
            const response = await fetch(classifyPath, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": csrfToken,
                },
                body: JSON.stringify({
                    question_id: payload.questionId,
                    target_tag_id: targetTagId,
                    source_tag_id: payload.sourceTagId,
                }),
            });

            if (!response.ok) {
                throw new Error(await response.text());
            }
        } catch {
            setState(previousState);
        }
    };

    // Sidebar resize handlers
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;
            const newWidth = e.clientX;
            if (newWidth < 80) {
                setSidebarCollapsed(true);
                setSidebarWidth(320);
            } else {
                setSidebarWidth(Math.max(200, Math.min(600, newWidth)));
                if (sidebarCollapsed) {
                    setSidebarCollapsed(false);
                }
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, sidebarCollapsed]);


    return (
        <ThemeProvider theme={workspaceTheme}>
            <Box sx={{ minHeight: "100vh", bgcolor: "background.default", color: "text.primary" }}>
                <Box sx={{ display: "flex" }}>
                    {/* Collapsed Sidebar Expand Button */}
                    {sidebarCollapsed && (
                        <IconButton
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            sx={{
                                position: "sticky",
                                top: 90,
                                left: 16,
                                zIndex: 1000,
                                bgcolor: "background.paper",
                                border: 1,
                                borderColor: "divider",
                                "&:hover": {
                                    bgcolor: "action.hover",
                                },
                                height: "fit-content",
                            }}
                        >
                            <MenuIcon />
                        </IconButton>
                    )}

                    <Box
                        sx={{
                            display: "flex",
                            width: "100%",
                            p: 3,
                            gap: sidebarCollapsed ? 0 : 3,
                        }}
                    >
                        {/* Left Sidebar - Tag Tree */}
                        {!sidebarCollapsed && (
                            <Paper
                                elevation={0}
                                sx={{
                                    width: sidebarWidth,
                                    flexShrink: 0,
                                    height: "fit-content",
                                    borderRadius: 2,
                                    border: 1,
                                    borderColor: "divider",
                                    display: "flex",
                                    flexDirection: "column",
                                    position: "sticky",
                                    top: 24,
                                    maxHeight: "calc(100vh - 48px)",
                                    animation: "fadeIn 0.3s ease-in-out"
                                }}
                            >
                                {/* Sidebar Header with Collapse Button */}
                                <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
                                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                                        <IconButton
                                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                                            size="small"
                                            sx={{
                                                bgcolor: "background.default",
                                                border: 1,
                                                borderColor: "divider",
                                                "&:hover": {
                                                    bgcolor: "action.hover",
                                                },
                                            }}
                                        >
                                            <MenuOpen />
                                        </IconButton>
                                        <Box>
                                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                Tags
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Organize your questions
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Box>

                                {/* Tag Tree List */}
                                <Box sx={{ flex: 1, overflow: "auto", px: 1, py: 1, maxHeight: "calc(100vh - 200px)" }}>
                                    {state.treeData.map((node) => (
                                        <SidebarNode
                                            key={node.id}
                                            node={node}
                                            expanded={expandedTagUuids}
                                            onToggle={(uuid) => {
                                                setExpandedTagUuids((current) => {
                                                    const next = new Set(current);
                                                    if (next.has(uuid)) next.delete(uuid);
                                                    else next.add(uuid);
                                                    return next;
                                                });
                                            }}
                                            onSelect={setSelectedTagUuid}
                                            onDeselectQuestion={() => setSelectedQuestionId(null)}
                                            onQuestionClick={handleQuestionClick}
                                            onQuestionDragStart={handleQuestionDragStart}
                                            onTagDrop={handleTagDrop}
                                        />
                                    ))}
                                </Box>

                                {/* Sidebar Footer with Actions */}
                                <Box sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        startIcon={<Add />}
                                        onClick={openActionsMenu}
                                        aria-controls={actionsAnchorEl ? "workspace-actions-menu" : undefined}
                                        aria-haspopup="true"
                                    >
                                        New
                                    </Button>
                                    <Menu id="workspace-actions-menu" anchorEl={actionsAnchorEl} open={Boolean(actionsAnchorEl)} onClose={closeActionsMenu}>
                                        <MenuItem
                                            onClick={() => {
                                                void handleCreateQuestion();
                                                closeActionsMenu();
                                            }}
                                        >
                                            New question
                                        </MenuItem>
                                        <MenuItem
                                            onClick={() => {
                                                void handleCreateTag();
                                                closeActionsMenu();
                                            }}
                                        >
                                            New tag
                                        </MenuItem>
                                    </Menu>
                                </Box>
                                {/* Resize Handle */}
                                <Box
                                    ref={resizeRef}
                                    onMouseDown={() => setIsResizing(true)}
                                    sx={{
                                        position: "absolute",
                                        right: 0,
                                        top: 0,
                                        bottom: 0,
                                        width: 4,
                                        cursor: "col-resize",
                                        bgcolor: "transparent",
                                        "&:hover": {
                                            bgcolor: "primary.main",
                                            opacity: 0.5,
                                        },
                                        transition: "background-color 0.2s",
                                    }}
                                />
                            </Paper>
                        )}


                        {/* Main Content Area */}
                        <Box sx={{ display: "grid", gap: 3, flex: 1, minWidth: 0 }}>
                            {/* Workspace Map */}
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 3,
                                    borderRadius: 2,
                                    border: 1,
                                    borderColor: "divider",
                                }}
                            >
                                {selectedTag ? (
                                    <Stack spacing={3}>
                                        {/* Breadcrumb or Tag Header */}
                                        <Box>
                                            {selectedQuestion ? (
                                                /* Breadcrumb Navigation when Question is Selected */
                                                <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 2 }}>
                                                    <Button
                                                        color="inherit"
                                                        onClick={() => setSelectedQuestionId(null)}
                                                        sx={{ textTransform: "none", p: 0, minWidth: "auto" }}
                                                    >
                                                        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                                                            <Box
                                                                sx={{
                                                                    width: 16,
                                                                    height: 16,
                                                                    borderRadius: "50%",
                                                                    bgcolor: selectedTag.color,
                                                                }}
                                                            />
                                                            <Typography variant="body1">{selectedTag.name}</Typography>
                                                        </Stack>
                                                    </Button>
                                                    <Typography variant="body1" color="text.primary" sx={{ fontWeight: 600 }}>
                                                        {selectedQuestion.slug}
                                                    </Typography>
                                                </Breadcrumbs>
                                            ) : (
                                                /* Normal Tag Header when no Question is Selected */
                                                <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 2 }}>
                                                    <Box
                                                        sx={{
                                                            width: 24,
                                                            height: 24,
                                                            borderRadius: "50%",
                                                            bgcolor: selectedTag.color,
                                                        }}
                                                    />
                                                    {!isEditingTag ? (
                                                        <>
                                                            <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                                                {selectedTag.name}
                                                            </Typography>
                                                            <Chip
                                                                label={selectedTag.slug}
                                                                size="small"
                                                                variant="outlined"
                                                                sx={{ ml: 1 }}
                                                            />
                                                        </>
                                                    ) : (
                                                        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flex: 1 }}>
                                                            <TextField size="small" value={tagNameDraft} onChange={(e) => setTagNameDraft(e.target.value)} />
                                                            <TextField size="small" value={tagSlugDraft} onChange={(e) => setTagSlugDraft(e.target.value)} sx={{ width: 160 }} />
                                                            <Box
                                                                onClick={() => setShowTagColorPicker(true)}
                                                                sx={{ width: 36, height: 36, borderRadius: 999, bgcolor: tagColorDraft || selectedTag.color || "#ffffff", border: "1px solid", borderColor: "divider", cursor: "pointer" }}
                                                                title="Click to change color"
                                                            />
                                                            <Button variant="contained" size="small" onClick={() => void handleSaveEditTag()}>Save</Button>
                                                            <Button variant="outlined" size="small" onClick={handleCancelEditTag}>Cancel</Button>
                                                        </Stack>
                                                    )}
                                                </Stack>
                                            )}

                                            {/* Action Buttons - hide when question is selected */}
                                            {!isEditingTag && !selectedQuestion && (
                                                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                                                    <Button
                                                        variant="contained"
                                                        size="small"
                                                        startIcon={<Add />}
                                                        onClick={() => void handleCreateTag(selectedTag.id)}
                                                    >
                                                        Add Sub-tag
                                                    </Button>
                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        startIcon={<Edit />}
                                                        onClick={() => void handleModifyTag()}
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        color="error"
                                                        startIcon={<Delete />}
                                                        onClick={() => handleDeleteTag(selectedTag.permalink)}
                                                    >
                                                        Delete
                                                    </Button>
                                                </Stack>
                                            )}
                                        </Box>

                                        {/* Question Detail Panel - shown within tag context when question is selected */}
                                        {selectedQuestion && (
                                            <QuestionDetailPanel
                                                question={selectedQuestion}
                                                csrfToken={csrfToken}
                                                onQuestionDeleted={handleQuestionDeleted}
                                                onQuestionSaved={(updatedQuestion: QuestionNode) => {
                                                    setState((current) => ({
                                                        treeData: updateQuestionInTree(current.treeData, updatedQuestion),
                                                        untaggedQuestions: current.untaggedQuestions.map((item) => (item.id === updatedQuestion.id ? { ...item, ...updatedQuestion } : item)),
                                                    }));
                                                }}
                                                slugEditable={selectedQuestion.id === slugEditQuestionId}
                                                slugValue={slugDraft}
                                                onSlugChange={(next: string) => setSlugDraft(next)}
                                                onSlugSave={async () => {
                                                    if (!selectedQuestion) return;
                                                    try {
                                                        const resp = await fetch(selectedQuestion.updatePath, {
                                                            method: "PATCH",
                                                            headers: {
                                                                "Content-Type": "application/json",
                                                                "X-CSRF-Token": csrfToken,
                                                                Accept: "application/json",
                                                                "X-Inline-Edit": "true",
                                                            },
                                                            body: JSON.stringify({ slug: slugDraft }),
                                                        });

                                                        if (!resp.ok) return;

                                                        const workspace = await fetchWorkspaceState(refreshPath);
                                                        if (!workspace) return;
                                                        lastWorkspaceSnapshot.current = JSON.stringify(workspace);
                                                        setState({ treeData: cloneTree(workspace.treeData), untaggedQuestions: [...workspace.untaggedQuestions] });
                                                        setSlugEditQuestionId(null);
                                                        setEditAfterSlugSaveId(selectedQuestion.id);
                                                    } catch {
                                                        // noop
                                                    }
                                                }}
                                                startEditing={editAfterSlugSaveId === selectedQuestion.id}
                                                onStartedEditing={() => setEditAfterSlugSaveId(null)}
                                                compactMode={true}
                                            />
                                        )}

                                        {/* Only show subtags and questions when no question is selected */}
                                        {!selectedQuestion && (
                                            <>
                                                <Divider />

                                                {/* Subtags Section */}
                                                <Box>
                                                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                                                        Subtags
                                                    </Typography>
                                                    <Grid container spacing={2}>
                                                        {selectedTag.subtags.map((child) => (
                                                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={child.id}>
                                                                <SubtagCard
                                                                    tag={child}
                                                                    onSelect={() => setSelectedTagUuid(child.uuid)}
                                                                    onDrop={handleTagDrop}
                                                                />
                                                            </Grid>
                                                        ))}
                                                    </Grid>
                                                    {selectedTag.subtags.length === 0 && (
                                                        <EmptyState
                                                            message="No subtags yet"
                                                            action={{
                                                                label: "Create first subtag",
                                                                onClick: () => void handleCreateTag(selectedTag.id),
                                                            }}
                                                        />
                                                    )}
                                                </Box>

                                                {/* Direct Questions Section */}
                                                <Box>
                                                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                                                        Direct Questions
                                                    </Typography>
                                                    <Grid container spacing={2}>
                                                        {/* Add Question Card */}
                                                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                                            <AddQuestionCard onClick={() => void handleCreateQuestionInTag(selectedTag.id)} />
                                                        </Grid>

                                                        {/* Question Cards */}
                                                        {selectedTag.questions.length > 0 ? (
                                                            (() => {
                                                                const total = selectedTag.questions.length;
                                                                const pages = Math.max(1, Math.ceil(total / DIRECT_PER_PAGE));
                                                                const start = (directQuestionsPage - 1) * DIRECT_PER_PAGE;
                                                                const pageItems = selectedTag.questions.slice(start, start + DIRECT_PER_PAGE);

                                                                return (
                                                                    <>
                                                                        {pageItems.map((question) => (
                                                                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={question.id}>
                                                                                <QuestionCard
                                                                                    question={question}
                                                                                    onDragStart={handleQuestionDragStart}
                                                                                    onClick={(q) => handleQuestionClick(q, selectedTag)}
                                                                                />
                                                                            </Grid>
                                                                        ))}
                                                                        {pages > 1 && (
                                                                            <Grid size={12}>
                                                                                <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                                                                                    <Pagination
                                                                                        count={pages}
                                                                                        page={directQuestionsPage}
                                                                                        onChange={(_, val) => setDirectQuestionsPage(val)}
                                                                                        color="primary"
                                                                                    />
                                                                                </Box>
                                                                            </Grid>
                                                                        )}
                                                                    </>
                                                                );
                                                            })()
                                                        ) : (
                                                            <Grid size={12}>
                                                                <EmptyState
                                                                    message="No direct questions yet"
                                                                    submessage="Drop a question here to attach it to this tag"
                                                                    action={{
                                                                        label: "Add first question",
                                                                        onClick: () => void handleCreateQuestionInTag(selectedTag.id),
                                                                    }}
                                                                />
                                                            </Grid>
                                                        )}
                                                    </Grid>
                                                </Box>
                                            </>
                                        )}
                                    </Stack>
                                ) : (
                                    <Typography variant="body1" color="text.secondary">No tags available yet.</Typography>
                                )}
                            </Paper>

                            {/* Create Tag Dialog */}
                            <Dialog open={showCreateTagModal} onClose={() => setShowCreateTagModal(false)}>
                                <DialogTitle>Create Tag</DialogTitle>
                                <DialogContent>
                                    <Stack spacing={2} sx={{ mt: 1, minWidth: 300 }}>
                                        <TextField label="Name" value={createTagName} onChange={(e) => setCreateTagName(e.target.value)} autoFocus />
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                            <Typography variant="body2" color="text.secondary">Color</Typography>
                                            <Box sx={{ flex: 1 }} />
                                            <Typography variant="body2" color="text.secondary">Parent: {createTagParentLabel}</Typography>
                                            <Box
                                                onClick={() => setShowCreateColorPicker(true)}
                                                sx={{ width: 28, height: 28, borderRadius: 999, bgcolor: createTagColor || "#ffffff", border: "1px solid", borderColor: "divider", cursor: "pointer" }}
                                                title="Click to choose color"
                                            />
                                        </Box>
                                        {showCreateColorPicker && (
                                            <Box sx={{ mt: 1 }}>
                                                <Colorful color={createTagColor || "#"} onChange={(c) => setCreateTagColor(colorToHex(c))} />
                                            </Box>
                                        )}
                                    </Stack>
                                </DialogContent>
                                <DialogActions>
                                    <Button onClick={() => setShowCreateTagModal(false)}>Cancel</Button>
                                    <Button onClick={() => void handleCreateTagSubmit()} variant="contained">Create</Button>
                                </DialogActions>
                            </Dialog>

                            {/* Delete Tag Confirmation Dialog */}
                            <Dialog open={showDeleteTagConfirm} onClose={() => setShowDeleteTagConfirm(false)}>
                                <DialogTitle>Delete Tag</DialogTitle>
                                <DialogContent>
                                    <Typography>Are you sure you want to delete this tag? This will detach questions from the tag.</Typography>
                                </DialogContent>
                                <DialogActions>
                                    <Button onClick={() => setShowDeleteTagConfirm(false)}>Cancel</Button>
                                    <Button
                                        color="error"
                                        variant="contained"
                                        onClick={async () => {
                                            setShowDeleteTagConfirm(false);
                                            if (performDeleteTag.current) await performDeleteTag.current();
                                        }}
                                    >
                                        Delete
                                    </Button>
                                </DialogActions>
                            </Dialog>

                            {/* Tag Color Picker Dialog */}
                            <Dialog open={showTagColorPicker} onClose={() => setShowTagColorPicker(false)}>
                                <DialogTitle>Choose Tag Color</DialogTitle>
                                <DialogContent>
                                    <Box sx={{ mt: 1 }}>
                                        <Colorful color={tagColorDraft || selectedTag?.color || "#"} onChange={(c) => setTagColorDraft(colorToHex(c))} />
                                    </Box>
                                </DialogContent>
                                <DialogActions>
                                    <Button onClick={() => setShowTagColorPicker(false)}>Close</Button>
                                </DialogActions>
                            </Dialog>

                            {/* Untagged Inbox */}
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 3,
                                    borderRadius: 2,
                                    border: 1,
                                    borderColor: "divider",
                                }}
                            >
                                <Stack
                                    direction="row"
                                    spacing={2}
                                    sx={{ alignItems: "center", mb: 2 }}
                                >
                                    <Inbox sx={{ color: "text.secondary" }} />
                                    <Box>
                                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                            Untagged Inbox
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {state.untaggedQuestions.length} questions awaiting classification
                                        </Typography>
                                    </Box>
                                </Stack>

                                <Grid container spacing={2}>
                                    {state.untaggedQuestions.map((question) => (
                                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={question.id}>
                                            <QuestionCard
                                                question={question}
                                                onDragStart={handleQuestionDragStart}
                                                onClick={(q) => {
                                                    // For untagged questions, select the question and set tag to "untagged"
                                                    setSelectedQuestionId(q.id);
                                                    setSelectedTagUuid(UNTAGGED_TAG.uuid);
                                                }}
                                            />
                                        </Grid>
                                    ))}
                                </Grid>

                                {state.untaggedQuestions.length === 0 && (
                                    <EmptyState
                                        icon={<Inbox sx={{ fontSize: 48, color: "text.disabled" }} />}
                                        message="All questions have been tagged"
                                        submessage="Great job organizing your content!"
                                    />
                                )}
                            </Paper>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </ThemeProvider>
    );
};



export default WorkspaceDashboard;
