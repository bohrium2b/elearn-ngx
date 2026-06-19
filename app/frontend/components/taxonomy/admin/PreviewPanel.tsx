import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  LinearProgress,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete
} from '@mui/material';
import {
  Add,
  Delete,
  Label,
  Quiz,
  FitnessCenter,
  OpenInNew
} from '@mui/icons-material';
import { TaxonomyNode, Tag, Question, Exercise } from '../types';
import { taxonomyApi, topicTagApi, topicExerciseApi } from '../api';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { QuestionCard } from '../../perseus/QuestionCard';
import Markdown from '../../perseus/Markdown';

interface PreviewPanelProps {
  node: TaxonomyNode | null;
  onNodeUpdate?: () => void;
}

interface TabPanelProps {
  children: React.ReactNode;
  value: number;
  index: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <Box role="tabpanel" hidden={value !== index} sx={{ p: 2 }}>
    {value === index && children}
  </Box>
);

export const PreviewPanel: React.FC<PreviewPanelProps> = ({ node, onNodeUpdate }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [tags, setTags] = useState<Tag[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [showExerciseDialog, setShowExerciseDialog] = useState(false);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  const loadResources = useCallback(async () => {
    if (!node) return;

    setLoading(true);
    try {
      const data = await taxonomyApi.getAllResources(node.id.toString());
      setTags(data.tags || []);
      setQuestions(data.questions || []);
      setExercises(data.exercises || []);
    } catch (error) {
      console.error('Failed to load resources:', error);
    } finally {
      setLoading(false);
    }
  }, [node]);

  useEffect(() => {
    if (node) {
      loadResources();
    }
  }, [node, loadResources]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const loadAvailableTags = async () => {
    try {
      const response = await fetch('/tag.json');
      const data = await response.json();
      setAvailableTags(data);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  };

  const loadAvailableExercises = async () => {
    try {
      const response = await fetch('/exercises.json');
      const data = await response.json();
      setAvailableExercises(data);
    } catch (error) {
      console.error('Failed to load exercises:', error);
    }
  };

  const handleAttachTag = async () => {
    if (!node || !selectedTag) return;

    try {
      await topicTagApi.create(node.id, selectedTag.id);
      await loadResources();
      setShowTagDialog(false);
      setSelectedTag(null);
      onNodeUpdate?.();
    } catch (error) {
      console.error('Failed to attach tag:', error);
    }
  };

  const handleDetachTag = async (tagId: number) => {
    if (!node) return;

    try {
      await topicTagApi.delete(node.id, tagId);
      await loadResources();
      onNodeUpdate?.();
    } catch (error) {
      console.error('Failed to detach tag:', error);
    }
  };

  const handleAttachExercise = async () => {
    if (!node || !selectedExercise) return;

    try {
      await topicExerciseApi.create(node.id, selectedExercise.id);
      await loadResources();
      setShowExerciseDialog(false);
      setSelectedExercise(null);
      onNodeUpdate?.();
    } catch (error) {
      console.error('Failed to attach exercise:', error);
    }
  };

  const handleDetachExercise = async (exerciseId: number) => {
    if (!node) return;

    try {
      await topicExerciseApi.delete(node.id, exerciseId);
      await loadResources();
      onNodeUpdate?.();
    } catch (error) {
      console.error('Failed to detach exercise:', error);
    }
  };

  if (!node) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography color="text.secondary">
          Select a node to preview
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" gutterBottom>
        Preview: {node.name}
      </Typography>

      <Paper sx={{ p: 1, mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Level
        </Typography>
        <Chip
          label={node.level}
          size="small"
          color={
            node.level === 'course' ? 'primary' :
              node.level === 'part' ? 'secondary' :
                node.level === 'unit' ? 'info' : 'success'
          }
        />
      </Paper>

      {node.description && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Description
          </Typography>
          <Typography variant="body2">
            {node.description}
          </Typography>
        </Paper>
      )}

      <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
        <Tab
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Label fontSize="small" />
              Tags ({tags.length})
            </Box>
          }
        />
        <Tab
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Quiz fontSize="small" />
              Questions ({questions.length})
            </Box>
          }
        />
        <Tab
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <FitnessCenter fontSize="small" />
              Exercises ({exercises.length})
            </Box>
          }
        />
      </Tabs>

      {loading ? (
        <LinearProgress />
      ) : (
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {/* Tags Tab */}
          <TabPanel value={activeTab} index={0}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2">Associated Tags</Typography>
              <Button
                size="small"
                startIcon={<Add />}
                onClick={() => {
                  loadAvailableTags();
                  setShowTagDialog(true);
                }}
              >
                Add Tag
              </Button>
            </Box>

            {tags.length === 0 ? (
              <Typography color="text.secondary" variant="body2">
                No tags attached to this topic
              </Typography>
            ) : (
              <List dense>
                {tags.map(tag => (
                  <ListItem key={tag.id}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: tag.color || 'primary.main',
                        mr: 1
                      }}
                    />
                    <ListItemText primary={tag.name} />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => handleDetachTag(tag.id)}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </TabPanel>

          {/* Questions Tab */}
          <TabPanel value={activeTab} index={1}>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Questions ({questions.length})
            </Typography>

            {questions.length === 0 ? (
              <Typography color="text.secondary" variant="body2">
                No questions assigned to this topic
              </Typography>
            ) : (
              <Box>
                {questions.map(question => (
                  <Paper key={question.id} sx={{ p: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ flex: 1 }}>
                        <Markdown>{question.question || ''}</Markdown>
                        <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
                          {question.tags?.map(tag => (
                            <Chip
                              key={tag.id}
                              label={tag.name}
                              size="small"
                              sx={{
                                backgroundColor: tag.color || 'primary.main',
                                color: 'white',
                                height: 20
                              }}
                            />
                          ))}
                        </Box>
                      </Box>
                      <IconButton
                        size="small"
                        href={`/questions/${question.path_identifier}`}
                        target="_blank"
                      >
                        <OpenInNew fontSize="small" />
                      </IconButton>
                    </Box>
                  </Paper>
                ))}
              </Box>
            )}
          </TabPanel>

          {/* Exercises Tab */}
          <TabPanel value={activeTab} index={2}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2">Associated Exercises</Typography>
              <Button
                size="small"
                startIcon={<Add />}
                onClick={() => {
                  loadAvailableExercises();
                  setShowExerciseDialog(true);
                }}
              >
                Add Exercise
              </Button>
            </Box>

            {exercises.length === 0 ? (
              <Typography color="text.secondary" variant="body2">
                No exercises attached to this topic
              </Typography>
            ) : (
              <List dense>
                {exercises.map(exercise => (
                  <ListItem key={exercise.id}>
                    <FitnessCenter fontSize="small" sx={{ mr: 1, color: 'secondary.main' }} />
                    <ListItemText
                      primary={exercise.name}
                      secondary={exercise.spec?.description}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        size="small"
                        href={`/exercises/${exercise.path_identifier}`}
                        target="_blank"
                      >
                        <OpenInNew fontSize="small" />
                      </IconButton>
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => handleDetachExercise(exercise.id)}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </TabPanel>
        </Box>
      )}

      {/* Attach Tag Dialog */}
      <Dialog open={showTagDialog} onClose={() => setShowTagDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Attach Tag to Topic</DialogTitle>
        <DialogContent>
          <Autocomplete
            options={availableTags}
            getOptionLabel={(option) => option.name}
            value={selectedTag}
            onChange={(_, newValue) => setSelectedTag(newValue)}
            renderInput={(params) => (
              <TextField {...params} label="Select Tag" margin="normal" />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTagDialog(false)}>Cancel</Button>
          <Button onClick={handleAttachTag} variant="contained" disabled={!selectedTag}>
            Attach
          </Button>
        </DialogActions>
      </Dialog>

      {/* Attach Exercise Dialog */}
      <Dialog open={showExerciseDialog} onClose={() => setShowExerciseDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Attach Exercise to Topic</DialogTitle>
        <DialogContent>
          <Autocomplete
            options={availableExercises}
            getOptionLabel={(option) => option.name}
            value={selectedExercise}
            onChange={(_, newValue) => setSelectedExercise(newValue)}
            renderInput={(params) => (
              <TextField {...params} label="Select Exercise" margin="normal" />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowExerciseDialog(false)}>Cancel</Button>
          <Button onClick={handleAttachExercise} variant="contained" disabled={!selectedExercise}>
            Attach
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
