import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Alert,
  Snackbar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  LinearProgress,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  Radio,
  Divider,
  Pagination,
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PreviewIcon from '@mui/icons-material/Preview';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import DescriptionIcon from '@mui/icons-material/Description';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import type { MultiChoiceChoice } from '../perseus/MultiChoice';
import { MultiChoice } from '../perseus/MultiChoice';

type SelectionRule = {
  id: string;
  type: 'dynamic_tag' | 'static_question';
  tag_uuid?: string;
  count?: number;
  strategy?: string;
  question_uuid?: string;
};

type ExerciseSpec = {
  selection_rules: SelectionRule[];
};

// Tree node types from the backend API
type QuestionNode = {
  id: number;
  uuid: string;
  slug: string;
  code: string | null;
  label: string;
  question: string;
  choices: MultiChoiceChoice[];
  hints: string[];
  numChoices: number;
  showPath: string;
  updatePath: string;
  type: 'question';
};

type TagTreeNode = {
  id: number;
  uuid: string;
  slug: string;
  name: string;
  color: string;
  permalink: string;
  type: 'tag';
  questions: QuestionNode[];
  children: TagTreeNode[];
};

// Legacy type for backward compatibility
type TagInfo = {
  uuid: string;
  name: string;
  max_questions: number;
  parent_id: string | null;
};

// Processed question for internal use
type QuestionInfo = {
  uuid: string;
  slug: string;
  content: string;
  hints: string[];
  options: MultiChoiceChoice[];
};

interface ExerciseBuilderProps {
  exerciseId?: string;
  initialTitle?: string;
  initialSpec?: ExerciseSpec;
  availableTags?: TagInfo[];
  availableQuestions?: QuestionNode[];
  tagTree?: TagTreeNode[];
  onSubmit?: (spec: ExerciseSpec) => void;
}

export const tagName = 'exercise-builder';

const generateId = () => 'rule_' + Math.random().toString(36).substr(2, 9);
const QUESTIONS_PER_PAGE = 10;

// Transform QuestionNode to internal format
const transformQuestion = (q: QuestionNode): QuestionInfo => {
  return {
    uuid: q.uuid,
    slug: q.slug || `question-${q.id}`,
    content: q.question || '',
    hints: q.hints || [],
    options: q.choices || [],
  };
};

// Flatten tree to get all questions
const flattenQuestions = (tree: TagTreeNode[]): QuestionNode[] => {
  const questions: QuestionNode[] = [];
  const traverse = (node: TagTreeNode) => {
    questions.push(...node.questions);
    node.children.forEach(traverse);
  };
  tree.forEach(traverse);
  return questions;
};

// Flatten tree to get all tags
const flattenTags = (tree: TagTreeNode[]): TagTreeNode[] => {
  return tree.flatMap((node) => [node, ...flattenTags(node.children)]);
};

// Get total questions count for a tag (including children)
const getTotalQuestionsCount = (node: TagTreeNode): number => {
  return node.questions.length + node.children.reduce((sum, child) => sum + getTotalQuestionsCount(child), 0);
};

const ExerciseBuilder = ({
  exerciseId,
  initialTitle = '',
  initialSpec,
  availableTags: _propsTags = [],
  availableQuestions: propsQuestions = [],
  tagTree: propsTagTree = [],
  onSubmit,
}: ExerciseBuilderProps) => {
  const [title, setTitle] = useState(initialTitle);
  const [rules, setRules] = useState<SelectionRule[]>(initialSpec?.selection_rules || []);
  const [tagTree, setTagTree] = useState<TagTreeNode[]>(propsTagTree);
  const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // Preview drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'tag' | 'question'>('question');
  const [selectedTagForPreview, setSelectedTagForPreview] = useState<string | null>(null);
  const [selectedStaticQuestions, setSelectedStaticQuestions] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [previewQuestionIndex, setPreviewQuestionIndex] = useState(0);
  const [taggedQuestions, setTaggedQuestions] = useState<QuestionInfo[]>([]);

  // Fetch tag tree on mount if not provided
  useEffect(() => {
    if (tagTree.length === 0) {
      fetch('/tag', { headers: { Accept: 'application/json' } })
        .then((res) => res.json())
        .then((data: TagTreeNode[]) => {
          setTagTree(data);
        })
        .catch((err) => console.error('Failed to fetch tag tree:', err));
    }
  }, [tagTree.length]);

  // Get all questions from tree or props
  const questions = useMemo(() => {
    if (tagTree.length > 0) {
      return flattenQuestions(tagTree).map(transformQuestion);
    }
    return propsQuestions.map(transformQuestion);
  }, [tagTree, propsQuestions]);

  // Get all tags from tree
  const allTags = useMemo(() => {
    return flattenTags(tagTree);
  }, [tagTree]);

  // Toggle tag expansion
  const toggleTag = (uuid: string) => {
    setExpandedTags((prev) => {
      const next = new Set(prev);
      if (next.has(uuid)) {
        next.delete(uuid);
      } else {
        next.add(uuid);
      }
      return next;
    });
  };

  const handleAddRule = (type: 'dynamic_tag' | 'static_question') => {
    const newRule: SelectionRule = {
      id: generateId(),
      type,
    };
    if (type === 'dynamic_tag') {
      newRule.tag_uuid = allTags[0]?.uuid || '';
      newRule.count = 1;
      newRule.strategy = 'random';
    } else {
      newRule.question_uuid = questions[0]?.uuid || '';
    }
    setRules((prev) => [...prev, newRule]);
  };

  const handleRuleChange = (index: number, field: string, value: string | number) => {
    setRules((prev) => {
      const updated = [...prev];
      const rule = updated[index];
      if (rule) {
        (rule as Record<string, string | number>)[field] = value;
      }
      return updated;
    });
  };

  const handleRemoveRule = (index: number) => {
    setRules((prev) => prev.filter((_, i) => i !== index));
  };

  // Find tag in tree by UUID
  const findTagInTree = (tree: TagTreeNode[], uuid: string): TagTreeNode | null => {
    for (const node of tree) {
      if (node.uuid === uuid) return node;
      const found = findTagInTree(node.children, uuid);
      if (found) return found;
    }
    return null;
  };

  // Preview drawer handlers
  const openPreviewDrawer = (mode: 'tag' | 'question', tagUuid?: string) => {
    setDrawerMode(mode);
    setCurrentPage(1);
    setPreviewQuestionIndex(0);

    if (mode === 'tag' && tagUuid) {
      setSelectedTagForPreview(tagUuid);
      // Get questions from the tag tree
      const tagNode = findTagInTree(tagTree, tagUuid);
      if (tagNode) {
        // Get all questions from this tag and its children
        const allQuestions = flattenQuestions([tagNode]);
        setTaggedQuestions(allQuestions.map(transformQuestion));
      } else {
        setTaggedQuestions([]);
      }
    } else {
      setSelectedTagForPreview(null);
    }

    setDrawerOpen(true);
  };

  const handleQuestionToggle = (questionUuid: string) => {
    setSelectedStaticQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionUuid)) {
        newSet.delete(questionUuid);
      } else {
        newSet.add(questionUuid);
      }
      return newSet;
    });
  };

  const handleAddStaticQuestions = () => {
    const newRules: SelectionRule[] = Array.from(selectedStaticQuestions).map((uuid) => ({
      id: generateId(),
      type: 'static_question' as const,
      question_uuid: uuid,
    }));
    setRules((prev) => [...prev, ...newRules]);
    setSelectedStaticQuestions(new Set());
    setDrawerOpen(false);
  };

  const validate = (): boolean => {
    const newErrors: string[] = [];
    if (!title.trim()) newErrors.push('Title is required');
    if (rules.length === 0) newErrors.push('At least one selection rule is required');

    rules.forEach((rule, index) => {
      if (rule.type === 'dynamic_tag') {
        if (!rule.tag_uuid) newErrors.push(`Rule ${index + 1}: Tag is required`);
        if (!rule.count || rule.count < 1) newErrors.push(`Rule ${index + 1}: Count must be at least 1`);
      }
      if (rule.type === 'static_question' && !rule.question_uuid) {
        newErrors.push(`Rule ${index + 1}: Question is required`);
      }
    });
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (onSubmit) {
      onSubmit({ selection_rules: rules });
      return;
    }

    setIsLoading(true);
    setErrors([]);

    const csrftoken =
      document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

    try {
      const url = exerciseId ? `/exercises/${exerciseId}` : '/exercises';
      const method = exerciseId ? 'PATCH' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrftoken },
        body: JSON.stringify({ exercise: { title, spec: { selection_rules: rules } } }),
      });
      if (!response.ok) throw new Error('Failed to save');
      setSuccess('Exercise saved successfully!');
      setSnackbarOpen(true);
    } catch (err) {
      setErrors([err instanceof Error ? err.message : 'Unknown error']);
    } finally {
      setIsLoading(false);
    }
  };

  // Pagination
  const currentQuestions = drawerMode === 'tag' ? taggedQuestions : questions;
  const totalPages = Math.ceil(currentQuestions.length / QUESTIONS_PER_PAGE);
  const paginatedQuestions = currentQuestions.slice(
    (currentPage - 1) * QUESTIONS_PER_PAGE,
    currentPage * QUESTIONS_PER_PAGE
  );

  // Get selected question for preview
  const previewQuestion = currentQuestions[previewQuestionIndex];

  // Tree node component for rendering the tag tree
  const TreeNode = ({ node, depth = 0 }: { node: TagTreeNode; depth?: number }) => {
    const isOpen = expandedTags.has(node.uuid);
    const hasChildren = node.children.length > 0 || node.questions.length > 0;

    return (
      <Box sx={{ pl: depth * 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            py: 0.5,
            cursor: 'pointer',
            '&:hover': { bgcolor: 'action.hover' },
          }}
          onClick={() => toggleTag(node.uuid)}
        >
          {hasChildren ? (
            isOpen ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />
          ) : (
            <Box sx={{ width: 24 }} />
          )}
          {isOpen ? (
            <FolderOpenIcon fontSize="small" sx={{ mr: 1, color: node.color }} />
          ) : (
            <FolderIcon fontSize="small" sx={{ mr: 1, color: node.color }} />
          )}
          <Typography variant="body2" sx={{ flex: 1 }}>
            {node.name}
          </Typography>
          <Chip label={getTotalQuestionsCount(node)} size="small" sx={{ height: 20, fontSize: '0.75rem' }} />
        </Box>
        {isOpen && (
          <Box>
            {node.questions.map((q) => (
              <Box
                key={q.uuid}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  py: 0.5,
                  pl: 4,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
                onClick={() => {
                  if (drawerMode === 'question') {
                    handleQuestionToggle(q.uuid);
                  } else {
                    const idx = taggedQuestions.findIndex((tq) => tq.uuid === q.uuid);
                    if (idx >= 0) setPreviewQuestionIndex(idx);
                  }
                }}
              >
                <DescriptionIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2" sx={{ flex: 1 }}>
                  {q.label}
                </Typography>
                {drawerMode === 'question' && (
                  <Checkbox
                    edge="end"
                    size="small"
                    checked={selectedStaticQuestions.has(q.uuid)}
                    onChange={() => handleQuestionToggle(q.uuid)}
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
              </Box>
            ))}
            {node.children.map((child) => (
              <TreeNode key={child.uuid} node={child} depth={depth + 1} />
            ))}
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ maxWidth: 800, margin: 'auto', p: 2 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        {exerciseId ? 'Edit Exercise' : 'Build New Exercise'}
      </Typography>

      <TextField
        label="Exercise Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        fullWidth
        sx={{ mb: 3 }}
      />

      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <Button variant="outlined" onClick={() => handleAddRule('dynamic_tag')} startIcon={<AddCircleIcon />}>
          Add Tag Rule
        </Button>
        <Button variant="outlined" onClick={() => setDrawerOpen(true)} startIcon={<PreviewIcon />}>
          Browse Questions
        </Button>
      </Box>

      {rules.map((rule, index) => (
        <Accordion key={rule.id} defaultExpanded sx={{ mb: 1 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Chip
              label={rule.type === 'dynamic_tag' ? 'Tag Rule' : 'Static Question'}
              size="small"
              sx={{ mr: 1 }}
            />
            <Typography>
              {rule.type === 'dynamic_tag'
                ? `${rule.count || 0} from ${rule.tag_uuid ? allTags.find((t) => t.uuid === rule.tag_uuid)?.name || 'Unknown' : 'Select Tag'}`
                : questions.find((q) => q.uuid === rule.question_uuid)?.slug || 'Selected Question'}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            {rule.type === 'dynamic_tag' ? (
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Tag</InputLabel>
                  <Select
                    value={rule.tag_uuid || ''}
                    onChange={(e) => handleRuleChange(index, 'tag_uuid', e.target.value)}
                    label="Tag"
                  >
                    <MenuItem value="">
                      <em>Select Tag</em>
                    </MenuItem>
                    {allTags.map((tag) => (
                      <MenuItem key={tag.uuid} value={tag.uuid}>
                        {tag.name} ({getTotalQuestionsCount(tag)})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  type="number"
                  size="small"
                  label="Count"
                  value={rule.count || 1}
                  onChange={(e) => handleRuleChange(index, 'count', parseInt(e.target.value) || 1)}
                  sx={{ width: 100 }}
                />
                {rule.tag_uuid && (
                  <Button
                    size="small"
                    onClick={() => openPreviewDrawer('tag', rule.tag_uuid)}
                    startIcon={<PreviewIcon />}
                  >
                    Preview
                  </Button>
                )}
                <IconButton onClick={() => handleRemoveRule(index)} size="small" color="error">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <FormControl size="small" sx={{ minWidth: 300 }}>
                  <InputLabel>Question</InputLabel>
                  <Select
                    value={rule.question_uuid || ''}
                    onChange={(e) => handleRuleChange(index, 'question_uuid', e.target.value)}
                    label="Question"
                  >
                    <MenuItem value="">
                      <em>Select Question</em>
                    </MenuItem>
                    {questions.map((q) => (
                      <MenuItem key={q.uuid} value={q.uuid}>
                        {q.slug}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  size="small"
                  onClick={() => openPreviewDrawer('question')}
                  startIcon={<PreviewIcon />}
                >
                  Browse
                </Button>
                <IconButton onClick={() => handleRemoveRule(index)} size="small" color="error">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            )}
          </AccordionDetails>
        </Accordion>
      ))}

      {isLoading && <LinearProgress sx={{ mb: 2 }} />}

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" onClick={handleSubmit} disabled={isLoading}>
          Save Exercise
        </Button>
      </Box>

      {errors.length > 0 && (
        <Box sx={{ mt: 2 }}>
          {errors.map((error, index) => (
            <Alert key={index} severity="error" sx={{ mb: 1 }}>
              {error}
            </Alert>
          ))}
        </Box>
      )}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSnackbarOpen(false)}>
          {success}
        </Alert>
      </Snackbar>

      {/* Preview Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{ '& .MuiDrawer-paper': { width: 600 } }}
      >
        <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {drawerMode === 'tag' ? 'Tag Questions' : 'Browse Questions'}
          </Typography>

          <Divider sx={{ mb: 2 }} />

          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Button
              variant={drawerMode === 'question' ? 'contained' : 'outlined'}
              onClick={() => { setDrawerMode('question'); setCurrentPage(1); }}
              size="small"
            >
              All Questions
            </Button>
            {selectedTagForPreview && (
              <Button
                variant={drawerMode === 'tag' ? 'contained' : 'outlined'}
                onClick={() => openPreviewDrawer('tag', selectedTagForPreview)}
                size="small"
              >
                Tag Questions
              </Button>
            )}
          </Box>

          {drawerMode === 'question' && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Selected: {selectedStaticQuestions.size} questions
              </Typography>
              <Button
                variant="contained"
                size="small"
                onClick={handleAddStaticQuestions}
                disabled={selectedStaticQuestions.size === 0}
              >
                Add Selected to Rules
              </Button>
            </Box>
          )}

          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {drawerMode === 'question' && tagTree.length > 0 ? (
              // Show tag tree view
              <Box>
                {tagTree.map((node) => (
                  <TreeNode key={node.uuid} node={node} />
                ))}
              </Box>
            ) : (
              // Show flat list for tag questions
              <List>
                {paginatedQuestions.map((q, idx) => {
                  const questionIndex = (currentPage - 1) * QUESTIONS_PER_PAGE + idx;
                  return (
                    <ListItem
                      key={q.uuid}
                      secondaryAction={
                        <Radio
                          edge="end"
                          checked={previewQuestionIndex === questionIndex}
                          onChange={() => setPreviewQuestionIndex(questionIndex)}
                        />
                      }
                    >
                      <ListItemText
                        primary={q.slug}
                        secondary={q.content ? q.content.substring(0, 100) + '...' : 'No content available'}
                      />
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Box>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(_, page) => setCurrentPage(page)}
                size="small"
              />
            </Box>
          )}

          {previewQuestion && (
            <Box sx={{ mt: 2, p: 2, border: '1px solid #eee', borderRadius: 1, maxHeight: 300, overflow: 'auto' }}>
              <Typography variant="subtitle2" gutterBottom>
                Preview: {previewQuestion.slug}
              </Typography>
              {previewQuestion.options && previewQuestion.options.length > 0 ? (
                <MultiChoice
                  question={previewQuestion.content}
                  choices={previewQuestion.options}
                  hints={previewQuestion.hints}
                />
              ) : (
                <Typography>{previewQuestion.content}</Typography>
              )}
            </Box>
          )}
        </Box>
      </Drawer>
    </Box>
  );
};

export default ExerciseBuilder;
