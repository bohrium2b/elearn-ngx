/**
 * TaxonomyFolderView.tsx – Folder view for displaying questions organized by tags
 *
 * Similar to the workspace view, this component displays tags in a sidebar
 * and shows questions under each tag in the main content area.
 */

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Chip,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
  Pagination,
  Breadcrumbs,
} from "@mui/material";
import {
  Add,
  NavigateNext,
  ExpandMore,
  ExpandLess,
  Folder,
  Label,
} from "@mui/icons-material";
import Grid from "@mui/material/Grid";

interface TagNode {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  color: string;
  permalink: string;
  questions: QuestionNode[];
  children: TagNode[];
}

interface QuestionNode {
  id: number;
  uuid: string;
  slug: string;
  code: string;
  label: string;
  question: string;
  type: string;
  showPath: string;
  updatePath: string;
}

interface TaxonomyFolderViewProps {
  treeData: TagNode[];
  untaggedQuestions: QuestionNode[];
  csrfToken: string;
}

export const TaxonomyFolderView: React.FC<TaxonomyFolderViewProps> = ({
  treeData,
  untaggedQuestions,
  csrfToken,
}) => {
  const [selectedTagUuid, setSelectedTagUuid] = useState<string | null>(
    treeData[0]?.uuid ?? null
  );
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
  const [expandedTagUuids, setExpandedTagUuids] = useState<Set<string>>(new Set());
  const [showCreateTagModal, setShowCreateTagModal] = useState(false);
  const [createTagName, setCreateTagName] = useState("");
  const [createTagColor, setCreateTagColor] = useState("");
  const [createTagParentId, setCreateTagParentId] = useState<number | null>(null);
  const [actionsAnchorEl, setActionsAnchorEl] = useState<HTMLElement | null>(null);
  const [directQuestionsPage, setDirectQuestionsPage] = useState(1);
  const DIRECT_PER_PAGE = 12;

  useEffect(() => {
    setDirectQuestionsPage(1);
  }, [selectedTagUuid]);

  const selectedTag = useMemo(() => {
    const findTag = (tags: TagNode[], uuid: string): TagNode | null => {
      for (const tag of tags) {
        if (tag.uuid === uuid) return tag;
        const found = findTag(tag.children, uuid);
        if (found) return found;
      }
      return null;
    };
    if (!selectedTagUuid) return null;
    if (selectedTagUuid === "__untagged__") {
      return {
        id: 0,
        uuid: "__untagged__",
        name: "Untagged Questions",
        slug: "untagged",
        color: "#999999",
        permalink: "#",
        questions: untaggedQuestions,
        children: [],
      };
    }
    return findTag(treeData, selectedTagUuid);
  }, [treeData, selectedTagUuid, untaggedQuestions]);

  const selectedQuestion = useMemo(() => {
    if (!selectedQuestionId || !selectedTag) return null;
    return selectedTag.questions.find((q) => q.id === selectedQuestionId) ?? null;
  }, [selectedTag, selectedQuestionId]);

  const handleToggleExpand = (uuid: string) => {
    setExpandedTagUuids((current) => {
      const next = new Set(current);
      if (next.has(uuid)) {
        next.delete(uuid);
      } else {
        next.add(uuid);
      }
      return next;
    });
  };

  const handleCreateTag = async () => {
    const name = createTagName?.trim();
    if (!name) return;

    try {
      const response = await fetch("/tag", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
          Accept: "application/json",
        },
        body: JSON.stringify({
          tag: {
            name,
            color: createTagColor || null,
            parent_id: createTagParentId,
          },
        }),
      });

      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to create tag:", error);
    }

    setShowCreateTagModal(false);
    setCreateTagName("");
    setCreateTagColor("");
    setCreateTagParentId(null);
  };

  const renderTagNode = (tag: TagNode, depth: number = 0) => {
    const isExpanded = expandedTagUuids.has(tag.uuid);
    const isSelected = selectedTagUuid === tag.uuid;
    const hasChildren = tag.children.length > 0;

    return (
      <Box key={tag.id}>
        <Box
          onClick={() => setSelectedTagUuid(tag.uuid)}
          sx={{
            display: "flex",
            alignItems: "center",
            pl: 2 + depth * 2,
            py: 0.5,
            cursor: "pointer",
            bgcolor: isSelected ? "action.selected" : "transparent",
            "&:hover": { bgcolor: "action.hover" },
            borderRadius: 1,
          }}
        >
          {hasChildren ? (
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleToggleExpand(tag.uuid); }}>
              {isExpanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
            </IconButton>
          ) : (
            <Box sx={{ width: 32 }} />
          )}
          <Label sx={{ mr: 1, color: tag.color, fontSize: 18 }} />
          <Typography variant="body2" sx={{ flex: 1 }}>
            {tag.name}
          </Typography>
          <Chip label={tag.questions.length} size="small" sx={{ ml: 1 }} />
        </Box>
        {hasChildren && isExpanded && (
          <Box>
            {tag.children.map((child) => renderTagNode(child, depth + 1))}
          </Box>
        )}
      </Box>
    );
  };

  const renderQuestionCard = (question: QuestionNode) => (
    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={question.id}>
      <Paper
        elevation={0}
        sx={{
          p: 2,
          cursor: "pointer",
          border: 1,
          borderColor: selectedQuestionId === question.id ? "primary.main" : "divider",
          "&:hover": { borderColor: "primary.light" },
        }}
        onClick={() => setSelectedQuestionId(question.id)}
      >
        <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
          {question.label}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {question.question?.replace(/[#*_]/g, "").substring(0, 100)}
        </Typography>
        <Chip label={question.type} size="small" sx={{ mt: 1 }} />
      </Paper>
    </Grid>
  );

  return (
    <Box sx={{ display: "flex", height: "100%", gap: 2, p: 2 }}>
      {/* Left Sidebar - Tag Tree */}
      <Paper
        elevation={0}
        sx={{
          width: 280,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          border: 1,
          borderColor: "divider",
          borderRadius: 2,
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between" }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Tags
            </Typography>
            <Button
              size="small"
              startIcon={<Add />}
              onClick={(e) => setActionsAnchorEl(e.currentTarget)}
            >
              New
            </Button>
          </Stack>
        </Box>

        <Box sx={{ flex: 1, overflow: "auto", py: 1 }}>
          {treeData.map((tag) => renderTagNode(tag))}

          {/* Untagged Questions */}
          <Box
            onClick={() => setSelectedTagUuid("__untagged__")}
            sx={{
              display: "flex",
              alignItems: "center",
              pl: 2,
              py: 0.5,
              cursor: "pointer",
              bgcolor: selectedTagUuid === "__untagged__" ? "action.selected" : "transparent",
              "&:hover": { bgcolor: "action.hover" },
              borderRadius: 1,
            }}
          >
            <Box sx={{ width: 32 }} />
            <Folder sx={{ mr: 1, color: "text.secondary", fontSize: 18 }} />
            <Typography variant="body2" sx={{ flex: 1 }}>
              Untagged
            </Typography>
            <Chip label={untaggedQuestions.length} size="small" sx={{ ml: 1 }} />
          </Box>
        </Box>

        <Menu
          anchorEl={actionsAnchorEl}
          open={Boolean(actionsAnchorEl)}
          onClose={() => setActionsAnchorEl(null)}
        >
          <MenuItem
            onClick={() => {
              setCreateTagParentId(null);
              setShowCreateTagModal(true);
              setActionsAnchorEl(null);
            }}
          >
            New Root Tag
          </MenuItem>
          {selectedTag && selectedTag.uuid !== "__untagged__" && (
            <MenuItem
              onClick={() => {
                setCreateTagParentId(selectedTag.id);
                setShowCreateTagModal(true);
                setActionsAnchorEl(null);
              }}
            >
              New Sub-tag in {selectedTag.name}
            </MenuItem>
          )}
        </Menu>
      </Paper>

      {/* Main Content Area */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {selectedTag && (
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: 1, borderColor: "divider" }}>
            <Stack spacing={3}>
              {/* Tag Header */}
              <Box>
                {selectedQuestion ? (
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
                      {selectedQuestion.label}
                    </Typography>
                  </Breadcrumbs>
                ) : (
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 2 }}>
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        bgcolor: selectedTag.color,
                      }}
                    />
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      {selectedTag.name}
                    </Typography>
                    <Chip label={selectedTag.slug} size="small" variant="outlined" sx={{ ml: 1 }} />
                  </Stack>
                )}

                {/* Action Buttons */}
                {!selectedQuestion && selectedTag.uuid !== "__untagged__" && (
                  <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<Add />}
                      onClick={() => {
                        setCreateTagParentId(selectedTag.id);
                        setShowCreateTagModal(true);
                      }}
                    >
                      Add Sub-tag
                    </Button>
                  </Stack>
                )}
              </Box>

              {/* Subtags Section */}
              {!selectedQuestion && selectedTag.children.length > 0 && (
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Subtags
                  </Typography>
                  <Grid container spacing={2}>
                    {selectedTag.children.map((child) => (
                      <Grid size={{ xs: 12, sm: 6, md: 4 }} key={child.id}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2,
                            cursor: "pointer",
                            border: 1,
                            borderColor: "divider",
                            "&:hover": { borderColor: "primary.light" },
                          }}
                          onClick={() => setSelectedTagUuid(child.uuid)}
                        >
                          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                            <Label sx={{ color: child.color }} />
                            <Typography variant="body1" sx={{ flex: 1 }}>
                              {child.name}
                            </Typography>
                            <Chip label={`${child.questions.length} Q`} size="small" />
                          </Stack>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {/* Questions Section */}
              {!selectedQuestion && (
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Questions ({selectedTag.questions.length})
                  </Typography>
                  <Grid container spacing={2}>
                    {selectedTag.questions.length > 0 ? (
                      (() => {
                        const total = selectedTag.questions.length;
                        const pages = Math.max(1, Math.ceil(total / DIRECT_PER_PAGE));
                        const start = (directQuestionsPage - 1) * DIRECT_PER_PAGE;
                        const pageItems = selectedTag.questions.slice(start, start + DIRECT_PER_PAGE);

                        return (
                          <>
                            {pageItems.map(renderQuestionCard)}
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
                        <Typography color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
                          No questions in this tag yet
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              )}

              {/* Selected Question Detail */}
              {selectedQuestion && (
                <Paper elevation={0} sx={{ p: 3, border: 1, borderColor: "divider" }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    {selectedQuestion.label}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedQuestion.question}
                  </Typography>
                  <Button
                    variant="outlined"
                    href={selectedQuestion.showPath}
                    target="_blank"
                  >
                    View Full Question
                  </Button>
                </Paper>
              )}
            </Stack>
          </Paper>
        )}

        {!selectedTag && (
          <Paper elevation={0} sx={{ p: 4, textAlign: "center", borderRadius: 2, border: 1, borderColor: "divider" }}>
            <Typography color="text.secondary">
              Select a tag to view its questions
            </Typography>
          </Paper>
        )}
      </Box>

      {/* Create Tag Dialog */}
      <Dialog open={showCreateTagModal} onClose={() => setShowCreateTagModal(false)}>
        <DialogTitle>Create Tag</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1, minWidth: 300 }}>
            <TextField
              label="Name"
              value={createTagName}
              onChange={(e) => setCreateTagName(e.target.value)}
              autoFocus
            />
            <TextField
              label="Color (hex)"
              value={createTagColor}
              onChange={(e) => setCreateTagColor(e.target.value)}
              placeholder="#3a7bd5"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateTagModal(false)}>Cancel</Button>
          <Button onClick={handleCreateTag} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TaxonomyFolderView;
