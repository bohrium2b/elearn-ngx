import React from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add,
  ExpandMore,
  ExpandLess,
  Folder,
  Label,
} from '@mui/icons-material';
import type { Question, TagNode } from '@/lib/types';

export interface TagExplorerProps {
  tags: TagNode[];
  untaggedQuestions: Question[];
  selectedTagUuid: string | null;
  selectedQuestionId: number | null;
  expandedTagUuids: Set<string>;
  showCreateTagModal: boolean;
  createTagName: string;
  createTagColor: string;
  onTagSelect: (uuid: string) => void;
  onTagToggle: (uuid: string) => void;
  onQuestionSelect: (id: number) => void;
  onCreateTag: (name: string, color: string, parentId: number | null) => void;
  onSetShowCreateTagModal: (show: boolean) => void;
  onSetCreateTagName: (name: string) => void;
  onSetCreateTagColor: (color: string) => void;
  renderTagActions?: (tag: TagNode) => React.ReactNode;
  renderQuestionActions?: (question: Question) => React.ReactNode;
  children: React.ReactNode;
}

export const TagExplorer: React.FC<TagExplorerProps> = ({
  tags,
  untaggedQuestions,
  selectedTagUuid,
  expandedTagUuids,
  showCreateTagModal,
  createTagName,
  createTagColor,
  onTagSelect,
  onTagToggle,
  onQuestionSelect,
  onCreateTag,
  onSetShowCreateTagModal,
  onSetCreateTagName,
  onSetCreateTagColor,
  renderTagActions,
  renderQuestionActions,
  children,
}) => {
  const renderTagNode = (tag: TagNode, depth: number = 0) => {
    const isExpanded = expandedTagUuids.has(tag.uuid);
    const isSelected = selectedTagUuid === tag.uuid;
    const hasChildren = tag.children.length > 0 || tag.questions.length > 0;

    return (
      <Box key={tag.uuid} sx={{ pl: depth * 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            py: 0.5,
            cursor: 'pointer',
            '&:hover': { bgcolor: 'action.hover' },
            bgcolor: isSelected ? 'action.selected' : 'transparent',
            borderRadius: 1,
          }}
          onClick={() => onTagSelect(tag.uuid)}
        >
          {hasChildren ? (
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onTagToggle(tag.uuid); }}>
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
          {renderTagActions?.(tag)}
        </Box>
        {isExpanded && (
          <Box>
            {tag.questions.map((q) => (
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
                onClick={() => onQuestionSelect(q.id)}
              >
                <Typography variant="body2" sx={{ flex: 1 }} noWrap>
                  {q.label}
                </Typography>
                {renderQuestionActions?.(q)}
              </Box>
            ))}
            {tag.children.map((child) => renderTagNode(child, depth + 1))}
          </Box>
        )}
      </Box>
    );
  };

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          width: 280,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          border: 1,
          borderColor: 'divider',
          borderRadius: 2,
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Tags
            </Typography>
            <Button
              size="small"
              startIcon={<Add />}
              onClick={() => onSetShowCreateTagModal(true)}
            >
              New
            </Button>
          </Stack>
        </Box>

        <Box sx={{ flex: 1, overflow: 'auto', py: 1 }}>
          {tags.map((tag) => renderTagNode(tag))}

          {/* Untagged Questions */}
          <Box
            onClick={() => onTagSelect('__untagged__')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              pl: 2,
              py: 0.5,
              cursor: 'pointer',
              bgcolor: selectedTagUuid === '__untagged__' ? 'action.selected' : 'transparent',
              '&:hover': { bgcolor: 'action.hover' },
              borderRadius: 1,
            }}
          >
            <Box sx={{ width: 32 }} />
            <Folder sx={{ mr: 1, color: 'text.secondary', fontSize: 18 }} />
            <Typography variant="body2" sx={{ flex: 1 }}>
              Untagged
            </Typography>
            <Chip label={untaggedQuestions.length} size="small" sx={{ ml: 1 }} />
          </Box>
        </Box>
      </Paper>

      {/* Create Tag Dialog */}
      <Dialog open={showCreateTagModal} onClose={() => onSetShowCreateTagModal(false)}>
        <DialogTitle>Create Tag</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1, minWidth: 300 }}>
            <TextField
              label="Name"
              value={createTagName}
              onChange={(e) => onSetCreateTagName(e.target.value)}
              autoFocus
            />
            <TextField
              label="Color (hex)"
              value={createTagColor}
              onChange={(e) => onSetCreateTagColor(e.target.value)}
              placeholder="#3a7bd5"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => onSetShowCreateTagModal(false)}>Cancel</Button>
          <Button onClick={() => onCreateTag(createTagName, createTagColor, null)} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {children}
    </>
  );
};
