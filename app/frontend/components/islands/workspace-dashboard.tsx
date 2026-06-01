import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Menu,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
  Pagination,
} from "@mui/material";
import { Colorful } from "@uiw/react-color";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { QuestionRendererWithUI } from "../perseus/QuestionRenderer";
import MultiChoiceEditorMemo, { type MultiChoiceEditorRef } from "../perseus/MultiChoiceEditor";
import type { Question } from "../perseus/types";

type QuestionNode = {
  id: number;
  uuid: string;
  slug: string;
  code?: string | null;
  label: string;
  question: string;
  choices: Array<{ content: string; correct: boolean; rationale?: string }>;
  hints: string[];
  numChoices: number;
  showPath: string;
  updatePath: string;
  source_tag_id?: number | null;
};

type TagNode = {
  id: number;
  uuid: string;
  slug: string;
  name: string;
  color: string;
  permalink: string;
  questions: QuestionNode[];
  subtags: TagNode[];
};

type WorkspaceProps = {
  treeData: TagNode[];
  untaggedQuestions: QuestionNode[];
  refreshPath: string;
  classifyPath: string;
  csrfToken: string;
};

type DragPayload = {
  questionId: number;
  sourceTagId: number | null;
};

type WorkspaceState = {
  treeData: TagNode[];
  untaggedQuestions: QuestionNode[];
};

const EMPTY_CHOICES: QuestionNode["choices"] = [];
const EMPTY_HINTS: string[] = [];

const colorToHex = (c: { hex?: string } | string | undefined): string => {
  if (!c) return "";
  if (typeof c === "string") return c;
  return c.hex ?? "";
};

function toPerseusQuestion(question: QuestionNode): Question {
  return {
    type: "multi-choice",
    question: question.question || "",
    choices: question.choices ?? EMPTY_CHOICES,
    hints: question.hints ?? EMPTY_HINTS,
    // Use the authoritative `code` when available. Do NOT fall back to slug —
    // Perseus `questionId` should not be set to the Rails slug.
    ...(question.code ? { questionId: question.code } : {}),
    numChoices: question.numChoices ?? 1,
  };
}

async function fetchWorkspaceState(refreshPath: string): Promise<WorkspaceState | null> {
  const response = await fetch(refreshPath, { headers: { Accept: "application/json" } });
  if (!response.ok) return null;
  return (await response.json()) as WorkspaceState;
}

function cloneTree(tree: TagNode[]): TagNode[] {
  return tree.map((node) => ({
    ...node,
    questions: [...node.questions],
    subtags: cloneTree(node.subtags),
  }));
}

function flattenTags(tree: TagNode[]): TagNode[] {
  return tree.flatMap((node) => [node, ...flattenTags(node.subtags)]);
}

function getTotalQuestionsCount(node: TagNode): number {
  return node.questions.length + node.subtags.reduce((sum, child) => sum + getTotalQuestionsCount(child), 0);
}

function flattenQuestions(tree: TagNode[], untaggedQuestions: QuestionNode[]): QuestionNode[] {
  const taggedQuestions = flattenTags(tree).flatMap((node) => node.questions);
  return [...untaggedQuestions, ...taggedQuestions];
}

function findSelectedTag(tree: TagNode[], selectedUuid: string | null): TagNode | null {
  if (!selectedUuid) return tree[0] ?? null;
  for (const node of flattenTags(tree)) {
    if (node.uuid === selectedUuid) return node;
  }
  return tree[0] ?? null;
}

function findSelectedQuestion(
  tree: TagNode[],
  untaggedQuestions: QuestionNode[],
  selectedQuestionId: number | null,
): QuestionNode | null {
  if (!selectedQuestionId) return null;

  return flattenQuestions(tree, untaggedQuestions).find((question) => question.id === selectedQuestionId) ?? null;
}

function removeQuestionFromTree(tree: TagNode[], questionId: number, sourceTagId: number | null): TagNode[] {
  return tree.map((node) => ({
    ...node,
    questions:
      sourceTagId === null || node.id === sourceTagId
        ? node.questions.filter((question) => question.id !== questionId)
        : node.questions,
    subtags: removeQuestionFromTree(node.subtags, questionId, sourceTagId),
  }));
}

function addQuestionToTag(tree: TagNode[], targetTagId: number, question: QuestionNode): TagNode[] {
  return tree.map((node) => ({
    ...node,
    questions:
      node.id === targetTagId && !node.questions.some((item) => item.id === question.id)
        ? [...node.questions, { ...question, source_tag_id: targetTagId }]
        : node.questions,
    subtags: addQuestionToTag(node.subtags, targetTagId, question),
  }));
}

function updateQuestionInTree(tree: TagNode[], updatedQuestion: QuestionNode): TagNode[] {
  return tree.map((node) => ({
    ...node,
    questions: node.questions.map((question) => (question.id === updatedQuestion.id ? { ...question, ...updatedQuestion } : question)),
    subtags: updateQuestionInTree(node.subtags, updatedQuestion),
  }));
}

function SidebarNode({
  node,
  expanded,
  onToggle,
  onSelect,
  onQuestionClick,
  onQuestionDragStart,
  onTagDrop,
}: {
  node: TagNode;
  expanded: Set<string>;
  onToggle: (uuid: string) => void;
  onSelect: (uuid: string) => void;
  onQuestionClick: (question: QuestionNode) => void;
  onQuestionDragStart: (payload: DragPayload) => void;
  onTagDrop: (targetTagId: number, payload: DragPayload) => void;
}): React.JSX.Element {
  const isOpen = expanded.has(node.uuid);
  const [showAllQuestionsInSidebar, setShowAllQuestionsInSidebar] = useState(false);

  return (
    <Box component="li" sx={{ listStyle: "none", mb: 0.75 }}>
      <Paper
        data-testid={`sidebar-tag-${node.id}`}
        elevation={0}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          const raw = event.dataTransfer.getData("application/json");
          if (!raw) return;
          onTagDrop(node.id, JSON.parse(raw) as DragPayload);
        }}
        sx={{
          px: 1,
          py: 0.75,
          borderRadius: 2,
          bgcolor: "rgba(24,33,47,0.03)",
          border: "1px solid rgba(24,33,47,0.06)",
        }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Button size="small" onClick={() => onToggle(node.uuid)} sx={{ minWidth: 44 }}>
            {isOpen ? "[-]" : "[+]"}
          </Button>
          <Button
            size="small"
            onClick={() => onSelect(node.uuid)}
            sx={{ justifyContent: "flex-start", textTransform: "none", fontWeight: 700, flex: 1 }}
          >
            <Box sx={{ width: 12, height: 12, borderRadius: 999, bgcolor: node.color, mr: 1 }} />
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
              <Box sx={{ flex: 1 }}>{node.name}</Box>
              <Chip label={String(getTotalQuestionsCount(node))} size="small" />
            </Box>
          </Button>
        </Stack>

      </Paper>

          {isOpen ? (
        <Box sx={{ pl: 2.5, mt: 1 }}>
          <Box component="ul" sx={{ p: 0, m: 0 }}>
            {(() => {
              const visible = showAllQuestionsInSidebar ? node.questions : node.questions.slice(0, 3);
              return (
                <>
                  {visible.map((question) => (
                    <Box component="li" key={question.id} sx={{ listStyle: "none", mb: 0.5 }}>
                      <Paper
                        draggable
                        onDragStart={(event) => {
                          const payload: DragPayload = { questionId: question.id, sourceTagId: node.id };
                          event.dataTransfer.setData("application/json", JSON.stringify(payload));
                          onQuestionDragStart(payload);
                        }}
                        elevation={0}
                        sx={{
                          cursor: "grab",
                          px: 1,
                          py: 0.75,
                          borderRadius: 2,
                          border: "1px solid rgba(24,33,47,0.1)",
                          bgcolor: "white",
                        }}
                      >
                        <Button
                          onClick={() => onQuestionClick(question)}
                          sx={{ textTransform: "none", justifyContent: "flex-start" }}
                        >
                          {question.label}
                        </Button>
                      </Paper>
                    </Box>
                  ))}

                  {node.questions.length > 3 ? (
                    <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
                      <Button size="small" onClick={() => setShowAllQuestionsInSidebar((s) => !s)}>
                        {showAllQuestionsInSidebar ? "Show less" : `... (${node.questions.length - 3} more)`}
                      </Button>
                    </Box>
                  ) : null}
                </>
              );
            })()}
          </Box>

          {node.subtags.length > 0 ? (
            <Box sx={{ mt: 1 }}>
              {node.subtags.map((child) => (
                <SidebarNode
                  key={child.id}
                  node={child}
                  expanded={expanded}
                  onToggle={onToggle}
                  onSelect={onSelect}
                  onQuestionClick={onQuestionClick}
                  onQuestionDragStart={onQuestionDragStart}
                  onTagDrop={onTagDrop}
                />
              ))}
            </Box>
          ) : null}
        </Box>
      ) : null}
    </Box>
  );
}

function QuestionCard({
  question,
  onDragStart,
  onClick,
}: {
  question: QuestionNode;
  onDragStart: (payload: DragPayload) => void;
  onClick: (question: QuestionNode) => void;
}): React.JSX.Element {
  return (
    <Paper
      data-testid={`question-card-${question.id}`}
      draggable
      onDragStart={(event) => {
        const payload: DragPayload = {
          questionId: question.id,
          sourceTagId: question.source_tag_id ?? null,
        };
        event.dataTransfer.setData("application/json", JSON.stringify(payload));
        onDragStart(payload);
      }}
      elevation={0}
      sx={{
        borderRadius: 3,
        border: "1px solid rgba(24, 33, 47, 0.12)",
        bgcolor: "white",
        cursor: "grab",
        p: 1.25,
      }}
    >
      <Button
        type="button"
        onClick={() => onClick(question)}
        sx={{ textAlign: "left", width: "100%", justifyContent: "flex-start", textTransform: "none" }}
      >
        <Stack spacing={0.25} sx={{ alignItems: "flex-start" }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
            {question.label}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {question.slug}
          </Typography>
        </Stack>
      </Button>
    </Paper>
  );
}

function QuestionDetailPanel({
  question,
  csrfToken,
  onQuestionDeleted,
  onQuestionSaved,
  slugEditable,
  slugValue,
  onSlugChange,
  onSlugSave,
  startEditing,
  onStartedEditing,
}: {
  question: QuestionNode;
  csrfToken: string;
  onQuestionDeleted: (questionId: number) => void;
  onQuestionSaved: (updatedQuestion: QuestionNode) => void;
  slugEditable?: boolean;
  slugValue?: string | null;
  onSlugChange?: (next: string) => void;
  onSlugSave?: () => void;
  startEditing?: boolean;
  onStartedEditing?: () => void;
}): React.JSX.Element {
  const [isEditing, setIsEditing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const editorRef = useRef<MultiChoiceEditorRef>(null);
  const [localSlugEditing, setLocalSlugEditing] = useState<boolean>(Boolean(slugEditable));
  const [slugSaving, setSlugSaving] = useState(false);
  const previewQuestion = useMemo(() => toPerseusQuestion(question), [question]);
  const previewKey = useMemo(
    () =>
      `${question.id}-${JSON.stringify({ q: question.question, choices: question.choices, hints: question.hints, numChoices: question.numChoices })}`,
    [question],
  );

  useEffect(() => {
    setIsEditing(false);
    setErrorMessage(null);
  }, [question]);

  useEffect(() => {
    setLocalSlugEditing(Boolean(slugEditable));
  }, [slugEditable]);

  useEffect(() => {
    if (startEditing) {
      setIsEditing(true);
      onStartedEditing?.();
    }
  }, [startEditing, onStartedEditing]);

  const handleSave = async () => {
    const currentQuestion = editorRef.current?.getQuestion() || "";
    const currentChoices = editorRef.current?.getChoices() || [];
    const currentHints = editorRef.current?.getHints() || [];
    const currentNumChoices = editorRef.current?.getNumChoices() || 1;

    if (currentQuestion.trim().length < 10) {
      setErrorMessage("Question must be at least 10 characters long.");
      return;
    }

    if (currentChoices.length < 2) {
      setErrorMessage("Question must include at least two choices.");
      return;
    }

    if (!currentChoices.some((choice) => choice.correct)) {
      setErrorMessage("Question must have at least one correct choice.");
      return;
    }

    const response = await fetch(question.updatePath, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
        "X-Inline-Edit": "true",
      },
      body: JSON.stringify({
        question: currentQuestion,
        choices: currentChoices,
        hints: currentHints,
        numChoices: currentNumChoices,
        slug: question.slug,
      }),
    });

    if (!response.ok) {
      setErrorMessage("Failed to save question changes.");
      return;
    }

    const payload = await response.json().catch(() => null);
    if (payload?.question) {
      onQuestionSaved({
        ...question,
        ...payload.question,
        source_tag_id: question.source_tag_id,
      } as QuestionNode);
      setIsEditing(false);
      return;
    }

    onQuestionSaved(question);
    setIsEditing(false);
  };

  const handleDeleteQuestion = async () => {
    if (!window.confirm(`Delete question ${question.label}?`)) {
      return;
    }

    const response = await fetch(question.updatePath, {
      method: "DELETE",
      headers: {
        "X-CSRF-Token": csrfToken,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      setErrorMessage("Failed to delete question.");
      return;
    }

    onQuestionDeleted(question.id);
  };

  return (
    <Paper data-testid="question-detail-panel" elevation={0} sx={{ p: 2, borderRadius: 4, border: "1px solid rgba(24, 33, 47, 0.12)", boxShadow: "0 24px 64px rgba(24, 33, 47, 0.08)" }}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", flexWrap: "wrap" }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>Selected Question</Typography>
          {localSlugEditing ? (
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <TextField size="small" value={slugValue ?? ""} onChange={(e) => onSlugChange?.(e.target.value)} />
              <Button
                size="small"
                onClick={async () => {
                  if (!onSlugSave) return;
                  setSlugSaving(true);
                  await onSlugSave();
                  setSlugSaving(false);
                  setLocalSlugEditing(false);
                }}
                variant="contained"
                disabled={slugSaving}
              >
                Save slug
              </Button>
            </Stack>
          ) : (
            <Chip label={question.slug} variant="outlined" />
          )}
          <Button data-testid="question-edit-toggle" size="small" variant="outlined" onClick={() => setIsEditing((current) => !current)}>
            {isEditing ? "View" : "Edit"}
          </Button>
          <Button data-testid="question-delete-button" size="small" color="error" variant="outlined" onClick={handleDeleteQuestion}>
            Delete question
          </Button>
        </Stack>

        {errorMessage ? <Typography color="error">{errorMessage}</Typography> : null}

        {!isEditing ? (
          <Box data-testid="question-preview-panel">
            <QuestionRendererWithUI key={previewKey} question={previewQuestion} />
          </Box>
        ) : (
          <Stack spacing={1.5}>
            <Box sx={{ border: "1px solid rgba(24, 33, 47, 0.08)", borderRadius: 3, overflow: "hidden", bgcolor: "white" }}>
              <MultiChoiceEditorMemo
                key={`${question.id}-${question.slug}`}
                ref={editorRef}
                question={question.question || ""}
                choices={question.choices ?? []}
                hints={question.hints ?? []}
                numChoices={question.numChoices ?? 1}
              />
            </Box>
            <Stack direction="row" spacing={1.5}>
              <Button data-testid="question-save-button" variant="contained" onClick={handleSave}>Save</Button>
              <Button variant="outlined" onClick={() => setIsEditing(false)}>Cancel</Button>
            </Stack>
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}

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
    }, 4000);

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

  const handleQuestionClick = (question: QuestionNode) => {
    setSelectedQuestionId(question.id);
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
    // Open the create-tag modal; parentId can be provided to create a subtag
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
    // Generate an 8-character alphanumeric slug client-side, include it in the
    // creation payload, and then select the created question so we can edit
    // the slug immediately.
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

    // Find the created question by slug and select it for slug editing.
    const all = flattenQuestions(workspace.treeData, workspace.untaggedQuestions);
    const created = all.find((q) => q.slug === slug);
    if (created) {
      setSelectedQuestionId(created.id);
      setSlugEditQuestionId(created.id);
      setSlugDraft(slug);
    }
  };

  const handleCreateQuestionInTag = async (targetTagId: number) => {
    // generate slug prefixed with 'question-'
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

    const all = flattenQuestions(workspace.treeData, workspace.untaggedQuestions);
    const created = all.find((q) => q.slug === slug);
    if (!created) return;

    // attach to tag via classifyPath
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

    // refresh and select
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
    // open confirm modal
    setShowDeleteTagConfirm(true);
    // store the path to delete in a ref closure via performDeleteTag
    performDeleteTag.current = async () => {
      const response = await fetch(deletePath, { method: "DELETE", headers: { "X-CSRF-Token": csrfToken } });
      if (response.ok) {
        window.location.href = "/";
      }
    };
  };

  const performDeleteTag = useRef<(() => Promise<void>) | null>(null);

  const handleModifyTag = async () => {
    // enable inline editing for the selected tag fields
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

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f7f3ed", color: "#18212f", fontFamily: '"Noto Serif", Georgia, serif' }}>
      <Paper elevation={0} sx={{ px: { xs: 2, md: 4 }, py: 2.5, borderBottom: "1px solid rgba(24, 33, 47, 0.12)", bgcolor: "rgba(255,255,255,0.75)", backdropFilter: "blur(14px)" }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 800 }}>
          Question Workspace
        </Typography>
        <Typography variant="body1" sx={{ mt: 0.5, color: "text.secondary" }}>
          Drag questions into tag nodes to classify them without a page reload.
        </Typography>
      </Paper>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "320px minmax(0, 1fr)" }, gap: 2, p: 2 }}>
        <Paper elevation={0} sx={{ p: 2, borderRadius: 4, border: "1px solid rgba(24, 33, 47, 0.12)", boxShadow: "0 24px 64px rgba(24, 33, 47, 0.08)" }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5 }}>Tag Tree</Typography>
          <Box component="ul" sx={{ p: 0, m: 0 }}>
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
                onQuestionClick={handleQuestionClick}
                onQuestionDragStart={handleQuestionDragStart}
                onTagDrop={handleTagDrop}
              />
            ))}
          </Box>
          <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
            <Button variant="contained" size="small" onClick={openActionsMenu} aria-controls={actionsAnchorEl ? "workspace-actions-menu" : undefined} aria-haspopup="true">
              Actions
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
        </Paper>

        <Box sx={{ display: "grid", gap: 2 }}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 4, border: "1px solid rgba(24, 33, 47, 0.12)", boxShadow: "0 24px 64px rgba(24, 33, 47, 0.08)" }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5 }}>Workspace Map</Typography>
            {selectedTag ? (
              <Stack spacing={2}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                  <Box sx={{ width: 16, height: 16, borderRadius: 999, bgcolor: selectedTag.color }} />
                  {!isEditingTag ? (
                    <>
                      <Typography variant="h5" sx={{ fontWeight: 800 }}>{selectedTag.name}</Typography>
                      <Chip label={selectedTag.slug} variant="outlined" />
                      <Button variant="outlined" size="small" onClick={() => void handleCreateTag(selectedTag.id)}>
                            Create sub-tag
                          </Button>
                      <Button variant="outlined" size="small" onClick={() => void handleModifyTag()}>
                        Modify tag
                      </Button>
                      <Button color="error" variant="outlined" size="small" onClick={() => handleDeleteTag(selectedTag.permalink)}>
                        Delete tag
                      </Button>
                    </>
                  ) : (
                    <>
                      <TextField size="small" value={tagNameDraft} onChange={(e) => setTagNameDraft(e.target.value)} />
                      <TextField size="small" value={tagSlugDraft} onChange={(e) => setTagSlugDraft(e.target.value)} sx={{ width: 160 }} />
                      <Box
                        onClick={() => setShowTagColorPicker(true)}
                        sx={{ width: 36, height: 36, borderRadius: 999, bgcolor: tagColorDraft || selectedTag.color || "#ffffff", border: "1px solid rgba(0,0,0,0.12)", cursor: "pointer" }}
                        title="Click to change color"
                      />
                      <Button variant="contained" size="small" onClick={() => void handleSaveEditTag()}>Save</Button>
                      <Button variant="outlined" size="small" onClick={handleCancelEditTag}>Cancel</Button>
                    </>
                  )}
                </Stack>

                <Divider />

                <Stack spacing={1.5}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Subtags</Typography>
                  <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 1 }}>
                      {selectedTag.subtags.map((child) => (
                        <Paper
                          data-testid={`tag-drop-zone-${child.id}`}
                          key={child.id}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={(event) => {
                            event.preventDefault();
                            const raw = event.dataTransfer.getData("application/json");
                            if (!raw) return;
                            handleTagDrop(child.id, JSON.parse(raw) as DragPayload);
                          }}
                          elevation={0}
                          sx={{
                            p: 1.5,
                            borderRadius: 3,
                            border: "1px solid rgba(24, 33, 47, 0.12)",
                            borderLeft: `8px solid ${child.color}`,
                            minHeight: 120,
                            bgcolor: "white",
                          }}
                        >
                          <Button type="button" onClick={() => setSelectedTagUuid(child.uuid)} sx={{ textTransform: "none", justifyContent: "flex-start" }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{child.name}</Typography>
                              <Chip label={String(getTotalQuestionsCount(child))} size="small" />
                            </Box>
                          </Button>

                          {selectedTag.subtags.length === 1 ? (
                            // If there's only one subtag, render its questions in responsive columns (use available space)
                            <Box sx={{ mt: 1, display: "grid", gap: 1, gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(3, 1fr)" } }}>
                              {child.questions.length > 0 ? (
                                child.questions.map((question) => (
                                  <QuestionCard key={question.id} question={question} onDragStart={handleQuestionDragStart} onClick={handleQuestionClick} />
                                ))
                              ) : (
                                <Typography variant="body2" color="text.secondary">No questions.</Typography>
                              )}
                            </Box>
                          ) : (
                            // If multiple subtags, show only a single question preview for each subtag
                            <Box sx={{ mt: 1, display: "grid", gap: 1 }}>
                              {child.questions.length > 0 ? (
                                <QuestionCard key={child.questions[0].id} question={child.questions[0]} onDragStart={handleQuestionDragStart} onClick={handleQuestionClick} />
                              ) : (
                                <Typography variant="body2" color="text.secondary">No questions.</Typography>
                              )}
                            </Box>
                          )}
                        </Paper>
                      ))}
                      {selectedTag.subtags.length === 0 ? <Typography variant="body2" color="text.secondary">No subtags yet.</Typography> : null}
                    </Box>
                </Stack>

                <Stack spacing={1.5}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Direct Questions</Typography>
                  <Box
                    sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(3, 1fr)" } }}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      const raw = event.dataTransfer.getData("application/json");
                      if (!raw) return;
                      handleTagDrop(selectedTag.id, JSON.parse(raw) as DragPayload);
                    }}
                  >
                    {/* Default add-card */}
                    <Paper
                      elevation={0}
                      sx={{ p: 1, borderRadius: 3, border: "1px dashed rgba(24,33,47,0.12)", bgcolor: "white", cursor: "pointer" }}
                      onClick={() => void handleCreateQuestionInTag(selectedTag.id)}
                      data-testid="add-question-card"
                    >
                      <Button sx={{ width: "100%", justifyContent: "flex-start", textTransform: "none" }}>+ Add question</Button>
                    </Paper>

                    {selectedTag.questions.length > 0 ? (
                      (() => {
                        const total = selectedTag.questions.length;
                        const pages = Math.max(1, Math.ceil(total / DIRECT_PER_PAGE));
                        const start = (directQuestionsPage - 1) * DIRECT_PER_PAGE;
                        const pageItems = selectedTag.questions.slice(start, start + DIRECT_PER_PAGE);

                        return (
                          <>
                            {pageItems.map((question) => (
                              <QuestionCard key={question.id} question={question} onDragStart={handleQuestionDragStart} onClick={handleQuestionClick} />
                            ))}
                            {pages > 1 ? (
                              <Box sx={{ gridColumn: "1 / -1", display: "flex", justifyContent: "center", mt: 1 }}>
                                <Pagination size="small" count={pages} page={directQuestionsPage} onChange={(_, val) => setDirectQuestionsPage(val)} />
                              </Box>
                            ) : null}
                          </>
                        );
                      })()
                    ) : (
                      <Typography variant="body2" color="text.secondary">Drop a question here to attach it to this tag.</Typography>
                    )}
                  </Box>
                </Stack>
              </Stack>
            ) : (
              <Typography variant="body1" color="text.secondary">No tags available yet.</Typography>
            )}
          </Paper>

            <Dialog open={showCreateTagModal} onClose={() => setShowCreateTagModal(false)}>
              <DialogTitle>Create Tag</DialogTitle>
              <DialogContent>
                <Stack spacing={1} sx={{ mt: 1 }}>
                  <TextField label="Name" value={createTagName} onChange={(e) => setCreateTagName(e.target.value)} autoFocus />
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ width: 12 }} />
                    <Typography variant="body2">Color</Typography>
                    <Box sx={{ flex: 1 }} />
                    <Typography variant="body2">Parent: {createTagParentLabel}</Typography>
                    <Box
                      onClick={() => setShowCreateColorPicker(true)}
                      sx={{ width: 28, height: 28, borderRadius: 999, bgcolor: createTagColor || "#ffffff", border: "1px solid rgba(0,0,0,0.12)", cursor: "pointer" }}
                      title="Click to choose color"
                    />
                  </Box>
                  {showCreateColorPicker ? (
                    <Box sx={{ mt: 1 }}>
                      <Colorful color={createTagColor || "#"} onChange={(c) => setCreateTagColor(colorToHex(c))} alpha={false} />
                    </Box>
                  ) : null}
                </Stack>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setShowCreateTagModal(false)}>Cancel</Button>
                <Button onClick={() => void handleCreateTagSubmit()} variant="contained">Create</Button>
              </DialogActions>
            </Dialog>

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

            <Dialog open={showTagColorPicker} onClose={() => setShowTagColorPicker(false)}>
              <DialogTitle>Choose Tag Color</DialogTitle>
              <DialogContent>
                <Box sx={{ mt: 1 }}>
                  <Colorful color={tagColorDraft || selectedTag?.color || "#"} onChange={(c) => setTagColorDraft(colorToHex(c))} alpha={false} />
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setShowTagColorPicker(false)}>Close</Button>
              </DialogActions>
            </Dialog>

          {selectedQuestion ? (
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

                  // Refresh workspace state after slug update
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
            />
          ) : null}

          <Paper elevation={0} sx={{ p: 2, borderRadius: 4, border: "1px solid rgba(24, 33, 47, 0.12)", boxShadow: "0 24px 64px rgba(24, 33, 47, 0.08)" }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5 }}>Untagged Inbox</Typography>
            <Box
              data-testid="untagged-question-pool"
              onDragOver={(event) => event.preventDefault()}
              sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 1 }}
            >
              {state.untaggedQuestions.map((question) => (
                <QuestionCard key={question.id} question={question} onDragStart={handleQuestionDragStart} onClick={handleQuestionClick} />
              ))}
              {state.untaggedQuestions.length === 0 ? <Typography variant="body2" color="text.secondary">No untagged questions remain.</Typography> : null}
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export const tagName = "workspace-dashboard";
export default WorkspaceDashboard;