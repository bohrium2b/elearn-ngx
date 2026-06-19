import React, { useState, useEffect, ChangeEvent } from 'react';
import {
  Box,
  Typography,
  TextField,
  List,
  ListItem,
  ListItemText,
  Tabs,
  Tab,
  InputAdornment,
  Collapse,
  Chip,
} from '@mui/material';
import {
  Search,
  Topic,
  ExpandMore,
  ExpandLess,
  Folder,
  FolderOpen,
  Quiz,
} from '@mui/icons-material';
import { TaxonomyNode, Tag, Question } from '../types';
import { taxonomyApi } from '../api';

interface InventoryPanelProps {
  onDragStart: (item: TaxonomyNode | Question | Tag, type: 'topic' | 'question' | 'tag') => void;
}

// Extended Tag type to include questions and children
interface TagWithQuestions extends Tag {
  questions?: Question[];
  children?: TagWithQuestions[];
}

export const InventoryPanel: React.FC<InventoryPanelProps> = ({ onDragStart }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [topics, setTopics] = useState<TaxonomyNode[]>([]);
  const [tags, setTags] = useState<TagWithQuestions[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [expandedTags, setExpandedTags] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      const [topicsData, questionsData, tagsData] = await Promise.all([
        taxonomyApi.getByLevel('topic'),
        fetch('/questions.json').then(r => r.json()),
        fetch('/tag.json').then(r => r.json())
      ]);
      setTopics(topicsData);
      setQuestions(questionsData);
      setTags(tagsData);
    } catch (error) {
      console.error('Failed to load inventory:', error);
    }
  };

  const toggleTagExpand = (tagId: number) => {
    setExpandedTags(prev => {
      const next = new Set(prev);
      if (next.has(tagId)) {
        next.delete(tagId);
      } else {
        next.add(tagId);
      }
      return next;
    });
  };

  const filteredTopics = topics.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredQuestions = questions.filter(q =>
    q.question?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter tags and their children recursively
  const filterTags = (tagList: TagWithQuestions[], query: string): TagWithQuestions[] => {
    return tagList.filter(tag => {
      const matchesQuery = tag.name.toLowerCase().includes(query.toLowerCase());
      const hasMatchingChildren = tag.children && filterTags(tag.children, query).length > 0;
      return matchesQuery || hasMatchingChildren;
    }).map(tag => ({
      ...tag,
      children: tag.children ? filterTags(tag.children, query) : []
    }));
  };

  const filteredTags = filterTags(tags, searchQuery);

  const handleDragStart = (e: React.DragEvent, item: TaxonomyNode | Question | Tag, type: 'topic' | 'question' | 'tag') => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type, item }));
    onDragStart(item, type);
  };

  const renderTagNode = (tag: TagWithQuestions, depth: number = 0) => {
    const isExpanded = expandedTags.has(tag.id);
    const hasChildren = tag.children && tag.children.length > 0;
    const hasQuestions = tag.questions && tag.questions.length > 0;
    const canExpand = hasChildren || hasQuestions;

    return (
      <Box key={tag.id}>
        <ListItem
          draggable
          onDragStart={(e) => handleDragStart(e, tag, 'tag')}
          sx={{
            pl: 2 + depth * 2,
            cursor: 'grab',
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          <Box
            onClick={(e) => {
              e.stopPropagation();
              if (canExpand) toggleTagExpand(tag.id);
            }}
            sx={{ display: 'flex', alignItems: 'center', flex: 1, cursor: canExpand ? 'pointer' : 'default' }}
          >
            {canExpand ? (
              isExpanded ? <ExpandLess fontSize="small" sx={{ mr: 0.5 }} /> : <ExpandMore fontSize="small" sx={{ mr: 0.5 }} />
            ) : (
              <Box sx={{ width: 20 }} />
            )}
            {isExpanded ? (
              <FolderOpen fontSize="small" sx={{ mr: 1, color: tag.color }} />
            ) : (
              <Folder fontSize="small" sx={{ mr: 1, color: tag.color }} />
            )}
            <ListItemText
              primary={tag.name}
              slotProps={{
                primary: { variant: 'body2' }
              }}
            />
            <Chip
              label={(tag.questions?.length || 0) + (tag.children?.length || 0)}
              size="small"
              sx={{ ml: 1, height: 20 }}
            />
          </Box>
        </ListItem>

        {/* Expanded content - show questions and child tags */}
        {isExpanded && (
          <Collapse in={isExpanded}>
            <Box>
              {/* Questions under this tag */}
              {hasQuestions && tag.questions?.map(question => (
                <ListItem
                  key={`q-${question.id}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, question, 'question')}
                  sx={{
                    pl: 6 + depth * 2,
                    cursor: 'grab',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <Quiz fontSize="small" sx={{ mr: 1, color: 'info.main' }} />
                  <ListItemText
                    primary={question.question?.substring(0, 40) + '...'}
                    secondary={question.type}
                    slotProps={{
                      primary: { variant: 'caption' }
                    }}
                  />
                </ListItem>
              ))}

              {/* Child tags */}
              {hasChildren && tag.children?.map(child => renderTagNode(child, depth + 1))}
            </Box>
          </Collapse>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" gutterBottom>
        Master Inventory
      </Typography>

      <TextField
        fullWidth
        size="small"
        placeholder="Search topics, tags, questions..."
        value={searchQuery}
        onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setSearchQuery(e.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
        sx={{ mb: 2 }}
      />

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 2 }}>
        <Tab label="Topics" />
        <Tab label="Tags" />
        <Tab label="Questions" />
      </Tabs>

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {/* Topics Tab */}
        {activeTab === 0 && (
          <List dense>
            {filteredTopics.map(topic => (
              <ListItem
                key={topic.id}
                draggable
                onDragStart={(e) => handleDragStart(e, topic, 'topic')}
                sx={{
                  cursor: 'grab',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
              >
                <Topic fontSize="small" sx={{ mr: 1, color: 'success.main' }} />
                <ListItemText
                  primary={topic.name}
                  secondary={`${topic.questions_count || 0} questions`}
                />
              </ListItem>
            ))}
            {filteredTopics.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                No topics found
              </Typography>
            )}
          </List>
        )}

        {/* Tags Tab - Folder View */}
        {activeTab === 1 && (
          <List dense disablePadding>
            {filteredTags.map(tag => renderTagNode(tag))}
            {filteredTags.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                No tags found
              </Typography>
            )}
          </List>
        )}

        {/* Questions Tab */}
        {activeTab === 2 && (
          <List dense>
            {filteredQuestions.map(question => (
              <ListItem
                key={question.id}
                draggable
                onDragStart={(e) => handleDragStart(e, question, 'question')}
                sx={{
                  cursor: 'grab',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
              >
                <Quiz fontSize="small" sx={{ mr: 1, color: 'info.main' }} />
                <ListItemText
                  primary={question.question?.substring(0, 50) + '...'}
                  secondary={question.type}
                />
              </ListItem>
            ))}
            {filteredQuestions.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                No questions found
              </Typography>
            )}
          </List>
        )}
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
        Drag items to topics in the canvas
      </Typography>
    </Box>
  );
};
