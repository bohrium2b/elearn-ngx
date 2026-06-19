import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { Course, TaxonomyNode, Part, Unit, Topic } from '../types';
import { adminTaxonomyApi } from '../api';
import { InventoryPanel } from './InventoryPanel';
import { PathwayCanvas } from './PathwayCanvas';
import { PreviewPanel } from './PreviewPanel';
import { ToastProvider } from '../ToastProvider';
import useToast from '../useToast';

export const CourseAssembler: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedNode, setSelectedNode] = useState<TaxonomyNode | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');
  const [loading, setLoading] = useState(true);
  const { success } = useToast();

  const loadCourses = useCallback(async () => {
    try {
      const data = await adminTaxonomyApi.getFullTree();
      setCourses(data);
      if (data.length > 0 && !selectedCourse) {
        setSelectedCourse(data[0] as Course);
      }
    } catch (err) {
      console.error('Failed to load courses:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCourse]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  // Optimistic update functions
  const addPartToCourse = useCallback((courseId: number, newPart: Part) => {
    setCourses(prev => prev.map(course => {
      if (course.id === courseId) {
        const updated = { ...course, parts: [...(course.parts || []), newPart] };
        if (selectedCourse?.id === courseId) {
          setSelectedCourse(updated);
        }
        return updated;
      }
      return course;
    }));
  }, [selectedCourse]);

  const updatePartInCourse = useCallback((courseId: number, updatedPart: Part) => {
    setCourses(prev => prev.map(course => {
      if (course.id === courseId) {
        const updated = {
          ...course,
          parts: course.parts?.map(p => p.id === updatedPart.id ? updatedPart : p) || []
        };
        if (selectedCourse?.id === courseId) {
          setSelectedCourse(updated);
        }
        return updated;
      }
      return course;
    }));
  }, [selectedCourse]);

  const deletePartFromCourse = useCallback((courseId: number, partId: number) => {
    setCourses(prev => prev.map(course => {
      if (course.id === courseId) {
        const updated = {
          ...course,
          parts: course.parts?.filter(p => p.id !== partId) || []
        };
        if (selectedCourse?.id === courseId) {
          setSelectedCourse(updated);
        }
        return updated;
      }
      return course;
    }));
  }, [selectedCourse]);

  const addUnitToPart = useCallback((courseId: number, partId: number, newUnit: Unit) => {
    setCourses(prev => prev.map(course => {
      if (course.id === courseId) {
        const updated = {
          ...course,
          parts: course.parts?.map(part => {
            if (part.id === partId) {
              return { ...part, units: [...(part.units || []), newUnit] };
            }
            return part;
          }) || []
        };
        if (selectedCourse?.id === courseId) {
          setSelectedCourse(updated);
        }
        return updated;
      }
      return course;
    }));
  }, [selectedCourse]);

  const updateUnitInPart = useCallback((courseId: number, partId: number, updatedUnit: Unit) => {
    setCourses(prev => prev.map(course => {
      if (course.id === courseId) {
        const updated = {
          ...course,
          parts: course.parts?.map(part => {
            if (part.id === partId) {
              return {
                ...part,
                units: part.units?.map(u => u.id === updatedUnit.id ? updatedUnit : u) || []
              };
            }
            return part;
          }) || []
        };
        if (selectedCourse?.id === courseId) {
          setSelectedCourse(updated);
        }
        return updated;
      }
      return course;
    }));
  }, [selectedCourse]);

  const deleteUnitFromPart = useCallback((courseId: number, partId: number, unitId: number) => {
    setCourses(prev => prev.map(course => {
      if (course.id === courseId) {
        const updated = {
          ...course,
          parts: course.parts?.map(part => {
            if (part.id === partId) {
              return { ...part, units: part.units?.filter(u => u.id !== unitId) || [] };
            }
            return part;
          }) || []
        };
        if (selectedCourse?.id === courseId) {
          setSelectedCourse(updated);
        }
        return updated;
      }
      return course;
    }));
  }, [selectedCourse]);

  const addTopicToUnit = useCallback((courseId: number, partId: number, unitId: number, newTopic: Topic) => {
    setCourses(prev => prev.map(course => {
      if (course.id === courseId) {
        const updated = {
          ...course,
          parts: course.parts?.map(part => {
            if (part.id === partId) {
              return {
                ...part,
                units: part.units?.map(unit => {
                  if (unit.id === unitId) {
                    return { ...unit, topics: [...(unit.topics || []), newTopic] };
                  }
                  return unit;
                }) || []
              };
            }
            return part;
          }) || []
        };
        if (selectedCourse?.id === courseId) {
          setSelectedCourse(updated);
        }
        return updated;
      }
      return course;
    }));
  }, [selectedCourse]);

  const updateTopicInUnit = useCallback((courseId: number, partId: number, unitId: number, updatedTopic: Topic) => {
    setCourses(prev => prev.map(course => {
      if (course.id === courseId) {
        const updated = {
          ...course,
          parts: course.parts?.map(part => {
            if (part.id === partId) {
              return {
                ...part,
                units: part.units?.map(unit => {
                  if (unit.id === unitId) {
                    return {
                      ...unit,
                      topics: unit.topics?.map(t => t.id === updatedTopic.id ? updatedTopic : t) || []
                    };
                  }
                  return unit;
                }) || []
              };
            }
            return part;
          }) || []
        };
        if (selectedCourse?.id === courseId) {
          setSelectedCourse(updated);
        }
        return updated;
      }
      return course;
    }));
  }, [selectedCourse]);

  const deleteTopicFromUnit = useCallback((courseId: number, partId: number, unitId: number, topicId: number) => {
    setCourses(prev => prev.map(course => {
      if (course.id === courseId) {
        const updated = {
          ...course,
          parts: course.parts?.map(part => {
            if (part.id === partId) {
              return {
                ...part,
                units: part.units?.map(unit => {
                  if (unit.id === unitId) {
                    return { ...unit, topics: unit.topics?.filter(t => t.id !== topicId) || [] };
                  }
                  return unit;
                }) || []
              };
            }
            return part;
          }) || []
        };
        if (selectedCourse?.id === courseId) {
          setSelectedCourse(updated);
        }
        return updated;
      }
      return course;
    }));
  }, [selectedCourse]);

  const handleCreateCourse = async () => {
    if (!newCourseName.trim()) return;

    try {
      const course = await adminTaxonomyApi.createNode({
        name: newCourseName,
        level: 'course'
      });
      const newCourse = { ...course, parts: [] } as Course;
      setCourses([...courses, newCourse]);
      setSelectedCourse(newCourse);
      setShowCreateDialog(false);
      setNewCourseName('');
      success('Course created successfully!');
    } catch (err) {
      console.error('Failed to create course:', err);
    }
  };

  const handleCourseChange = (courseId: string) => {
    const course = courses.find(c => c.id.toString() === courseId);
    setSelectedCourse(course || null);
  };

  const handleDragStart = (_item: unknown, _type: 'topic' | 'question' | 'tag') => {
    // Drag start handled by browser
  };

  if (loading) {
    return <LinearProgress />;
  }

  return (
    <ToastProvider>
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h5">
              Course Assembly Center
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FormControl sx={{ minWidth: 200 }} size="small">
                <InputLabel>Select Course</InputLabel>
                <Select
                  value={selectedCourse?.id?.toString() || ''}
                  onChange={(e) => handleCourseChange(e.target.value)}
                  label="Select Course"
                >
                  {courses.map(course => (
                    <MenuItem key={course.id} value={course.id.toString()}>
                      {course.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setShowCreateDialog(true)}
              >
                New Course
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* Main Content */}
        <Grid container spacing={2} sx={{ flex: 1, px: 2 }}>
          {/* Left Panel - Inventory */}
          <Grid size={{ xs: 3 }}>
            <Paper sx={{ height: '100%', p: 2 }}>
              <InventoryPanel onDragStart={handleDragStart} />
            </Paper>
          </Grid>

          {/* Center Panel - Canvas */}
          <Grid size={{ xs: 6 }}>
            <Paper sx={{ height: '100%', p: 2 }}>
              <PathwayCanvas
                course={selectedCourse}
                onCourseUpdate={loadCourses}
                onNodeSelect={setSelectedNode}
                // Optimistic update callbacks
                onPartAdded={addPartToCourse}
                onPartUpdated={updatePartInCourse}
                onPartDeleted={deletePartFromCourse}
                onUnitAdded={addUnitToPart}
                onUnitUpdated={updateUnitInPart}
                onUnitDeleted={deleteUnitFromPart}
                onTopicAdded={addTopicToUnit}
                onTopicUpdated={updateTopicInUnit}
                onTopicDeleted={deleteTopicFromUnit}
              />
            </Paper>
          </Grid>

          {/* Right Panel - Preview */}
          <Grid size={{ xs: 3 }}>
            <Paper sx={{ height: '100%', p: 2 }}>
              <PreviewPanel node={selectedNode} />
            </Paper>
          </Grid>
        </Grid>

        {/* Create Course Dialog */}
        <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)}>
          <DialogTitle>Create New Course</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Course Name"
              fullWidth
              value={newCourseName}
              onChange={(e) => setNewCourseName(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateCourse} variant="contained">
              Create
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ToastProvider>
  );
};
