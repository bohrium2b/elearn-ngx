import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Button,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  Add,
  MoreVert,
  Delete,
  Edit,
  DragHandle,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import { Course, Part, Unit, Topic, TaxonomyNode } from '../types';
import { adminTaxonomyApi } from '../api';
import useToast from '../useToast';

interface PathwayCanvasProps {
  course: Course | null;
  onCourseUpdate: () => void;
  onNodeSelect: (node: TaxonomyNode) => void;
  // Optimistic update callbacks
  onPartAdded?: (courseId: number, newPart: Part) => void;
  onPartUpdated?: (courseId: number, updatedPart: Part) => void;
  onPartDeleted?: (courseId: number, partId: number) => void;
  onUnitAdded?: (courseId: number, partId: number, newUnit: Unit) => void;
  onUnitUpdated?: (courseId: number, partId: number, updatedUnit: Unit) => void;
  onUnitDeleted?: (courseId: number, partId: number, unitId: number) => void;
  onTopicAdded?: (courseId: number, partId: number, unitId: number, newTopic: Topic) => void;
  onTopicUpdated?: (courseId: number, partId: number, unitId: number, updatedTopic: Topic) => void;
  onTopicDeleted?: (courseId: number, partId: number, unitId: number, topicId: number) => void;
}

export const PathwayCanvas: React.FC<PathwayCanvasProps> = ({
  course,
  onCourseUpdate,
  onNodeSelect,
  onPartAdded,
  onPartUpdated,
  onPartDeleted,
  onUnitAdded,
  onUnitUpdated,
  onUnitDeleted,
  onTopicAdded,
  onTopicUpdated,
  onTopicDeleted,
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedNode, setSelectedNode] = useState<TaxonomyNode | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  
  // Dialog states
  const [showPartDialog, setShowPartDialog] = useState(false);
  const [showUnitDialog, setShowUnitDialog] = useState(false);
  const [showTopicDialog, setShowTopicDialog] = useState(false);
  const [editingNode, setEditingNode] = useState<Part | Unit | Topic | null>(null);
  const [nodeName, setNodeName] = useState('');
  const [nodeDescription, setNodeDescription] = useState('');
  const [dialogParentId, setDialogParentId] = useState<number | null>(null);
  const [dialogLevel, setDialogLevel] = useState<'part' | 'unit' | 'topic'>('part');
  
  const { success } = useToast();

  const toggleExpand = (nodeId: number) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent parent drop zones from triggering
    setDropTarget(targetId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    setDropTarget(null);
  };

  const handleDrop = async (e: React.DragEvent, targetId: string, targetType: 'unit' | 'course' | 'topic' | 'part') => {
    e.preventDefault();
    e.stopPropagation(); // Prevent parent drop zones from triggering
    setDropTarget(null);

    const rawData = e.dataTransfer.getData('application/json');
    console.log('Drop raw data:', rawData, 'targetType:', targetType, 'targetId:', targetId);
    
    if (!rawData) {
      console.error('No data in drop event');
      return;
    }
    
    let data;
    try {
      data = JSON.parse(rawData);
    } catch (err) {
      console.error('Failed to parse drop data:', err);
      return;
    }
    
    const { type, item } = data;
    console.log('Drop type:', type, 'item:', item);

    // Extract the actual ID from targetId (handles "topic-123", "unit-123", "unit-123-inner", "part-123", "course" formats)
    let actualId: number;
    if (targetId === 'course') {
      actualId = 0; // Special case for course
    } else {
      // Remove prefix (topic-, unit-, part-) and -inner suffix, then parse
      const cleanedId = targetId.replace(/^(topic|unit|part)-/, '').replace('-inner', '');
      actualId = parseInt(cleanedId);
    }
    
    console.log('Parsed actualId:', actualId, 'from targetId:', targetId, 'type:', type, 'targetType:', targetType);

    try {
      if (type === 'topic') {
        if (targetType === 'unit') {
          // Add topic to unit
          const unit = course?.parts
            ?.flatMap(p => p.units)
            ?.find(u => u.id === actualId);
          const parentPart = course?.parts?.find(p => p.units?.some(u => u.id === actualId));

          if (unit && course && parentPart) {
            const updatedTopic = await adminTaxonomyApi.updateNode(item.id.toString(), {
              parent_id: unit.id,
              course_id: course.id
            });
            success('Topic added to unit');
            
            // Optimistic update
            if (onTopicAdded) {
              onTopicAdded(course.id, parentPart.id, unit.id, updatedTopic as Topic);
            } else {
              onCourseUpdate();
            }
          }
        } else if (targetType === 'course') {
          // Dropping onto course - create a new part first, then add unit and topic
          if (course) {
            // Create a new part
            const newPart = await adminTaxonomyApi.createNode({
              name: 'New Part',
              level: 'part',
              parent_id: course.id,
              course_id: course.id
            });

            // Create a new unit under the part
            const newUnit = await adminTaxonomyApi.createNode({
              name: 'New Unit',
              level: 'unit',
              parent_id: newPart.id,
              course_id: course.id
            });

            // Move the topic to the new unit
            await adminTaxonomyApi.updateNode(item.id.toString(), {
              parent_id: newUnit.id,
              course_id: course.id
            });

            success('New part and unit created with topic');
            
            // Use optimistic updates if available
            if (onPartAdded) {
              const partWithUnits = { ...newPart, units: [{ ...newUnit, topics: [item] }] } as Part;
              onPartAdded(course.id, partWithUnits);
            } else {
              onCourseUpdate();
            }
          }
        }
      } else if (type === 'question' && targetType === 'topic') {
        // Add question to topic via content assignment
        const topic = course?.parts
          ?.flatMap(p => p.units)
          ?.flatMap(u => u.topics)
          ?.find(t => t.id === actualId);

        if (topic && course) {
          // Create content assignment
          const response = await fetch('/content_assignments', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-Token': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
            },
            body: JSON.stringify({
              content_assignment: {
                taxonomy_node_id: topic.id,
                question_id: item.id
              }
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMsg = errorData.errors?.join(', ') || errorData.message || 'Failed to add question';
            throw new Error(errorMsg);
          }
          
          success('Question added to topic');
          onCourseUpdate();
        }
      } else if (type === 'tag' && targetType === 'topic') {
        // Add all questions from tag to topic
        const topic = course?.parts
          ?.flatMap(p => p.units)
          ?.flatMap(u => u.topics)
          ?.find(t => t.id === actualId);

        if (topic && course && item.questions) {
          let successCount = 0;
          for (const question of item.questions) {
            const response = await fetch('/content_assignments', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
              },
              body: JSON.stringify({
                content_assignment: {
                  taxonomy_node_id: topic.id,
                  question_id: question.id
                }
              })
            });
            
            if (response.ok) {
              successCount++;
            }
          }
          
          if (successCount > 0) {
            success(`Added ${successCount} of ${item.questions.length} questions from tag to topic`);
            onCourseUpdate();
          } else {
            throw new Error('Failed to add any questions from tag');
          }
        }
      }
    } catch (err) {
      // Error toast is already shown by the API or thrown error
      console.error('Failed to add item:', err);
    }
  };

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, node: TaxonomyNode) => {
    setMenuAnchor(e.currentTarget);
    setSelectedNode(node);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedNode(null);
  };

  const handleDeleteNode = async () => {
    if (selectedNode && course) {
      try {
        await adminTaxonomyApi.deleteNode(selectedNode.id.toString());
        success('Node deleted successfully');
        
        // Optimistic update based on node type
        if (selectedNode.level === 'part' && onPartDeleted) {
          onPartDeleted(course.id, selectedNode.id);
        } else if (selectedNode.level === 'unit' && onUnitDeleted) {
          // Find parent part
          const parentPart = course.parts?.find(p => p.units?.some(u => u.id === selectedNode.id));
          if (parentPart) {
            onUnitDeleted(course.id, parentPart.id, selectedNode.id);
          }
        } else if (selectedNode.level === 'topic' && onTopicDeleted) {
          // Find parent unit and part
          const parentPart = course.parts?.find(p =>
            p.units?.some(u => u.topics?.some(t => t.id === selectedNode.id))
          );
          const parentUnit = parentPart?.units?.find(u =>
            u.topics?.some(t => t.id === selectedNode.id)
          );
          if (parentPart && parentUnit) {
            onTopicDeleted(course.id, parentPart.id, parentUnit.id, selectedNode.id);
          }
        } else {
          // Fallback to full reload
          onCourseUpdate();
        }
      } catch (err) {
        console.error('Failed to delete node:', err);
      }
    }
    handleMenuClose();
  };

  // Dialog handlers
  const openPartDialog = (parentId: number, existingPart?: Part) => {
    setDialogLevel('part');
    setDialogParentId(parentId);
    setEditingNode(existingPart || null);
    setNodeName(existingPart?.name || '');
    setNodeDescription(existingPart?.description || '');
    setShowPartDialog(true);
  };

  const openUnitDialog = (parentId: number, existingUnit?: Unit) => {
    setDialogLevel('unit');
    setDialogParentId(parentId);
    setEditingNode(existingUnit || null);
    setNodeName(existingUnit?.name || '');
    setNodeDescription(existingUnit?.description || '');
    setShowUnitDialog(true);
  };

  const openTopicDialog = (parentId: number, existingTopic?: Topic) => {
    setDialogLevel('topic');
    setDialogParentId(parentId);
    setEditingNode(existingTopic || null);
    setNodeName(existingTopic?.name || '');
    setNodeDescription(existingTopic?.description || '');
    setShowTopicDialog(true);
  };

  const handleSaveNode = async () => {
    if (!nodeName.trim() || !dialogParentId || !course) return;

    try {
      if (editingNode) {
        // Update existing node
        const updated = await adminTaxonomyApi.updateNode(editingNode.id.toString(), {
          name: nodeName,
          description: nodeDescription
        });
        success(`${dialogLevel} updated successfully`);
        
        // Optimistic update
        if (dialogLevel === 'part' && onPartUpdated) {
          onPartUpdated(course.id, updated as Part);
        } else if (dialogLevel === 'unit' && onUnitUpdated) {
          const parentPart = course.parts?.find(p => p.units?.some(u => u.id === editingNode.id));
          if (parentPart) {
            onUnitUpdated(course.id, parentPart.id, updated as Unit);
          }
        } else if (dialogLevel === 'topic' && onTopicUpdated) {
          const parentPart = course.parts?.find(p =>
            p.units?.some(u => u.topics?.some(t => t.id === editingNode.id))
          );
          const parentUnit = parentPart?.units?.find(u =>
            u.topics?.some(t => t.id === editingNode.id)
          );
          if (parentPart && parentUnit) {
            onTopicUpdated(course.id, parentPart.id, parentUnit.id, updated as Topic);
          }
        }
      } else {
        // Create new node
        const created = await adminTaxonomyApi.createNode({
          name: nodeName,
          description: nodeDescription,
          level: dialogLevel,
          parent_id: dialogParentId,
          course_id: course.id
        });
        success(`${dialogLevel} created successfully`);
        
        console.log('Created:', created, 'dialogLevel:', dialogLevel, 'dialogParentId:', dialogParentId);
        
        // Optimistic update
        if (dialogLevel === 'part' && onPartAdded) {
          onPartAdded(course.id, { ...created, units: [] } as Part);
        } else if (dialogLevel === 'unit' && onUnitAdded) {
          // dialogParentId is the partId for units
          onUnitAdded(course.id, dialogParentId, { ...created, topics: [] } as Unit);
        } else if (dialogLevel === 'topic' && onTopicAdded) {
          // dialogParentId is the unitId for topics
          const parentPart = course.parts?.find(p => p.units?.some(u => u.id === dialogParentId));
          console.log('Parent part for topic:', parentPart);
          if (parentPart) {
            onTopicAdded(course.id, parentPart.id, dialogParentId, { ...created, questions_count: 0 } as Topic);
          } else {
            // Fallback: reload if parent part not found
            console.warn('Parent part not found for topic, reloading...');
            onCourseUpdate();
          }
        }
      }
    } catch (err) {
      console.error(`Failed to save ${dialogLevel}:`, err);
    }

    setShowPartDialog(false);
    setShowUnitDialog(false);
    setShowTopicDialog(false);
    setNodeName('');
    setNodeDescription('');
    setEditingNode(null);
  };

  const renderTopic = (topic: Topic, unitId: number) => (
    <Box
      key={topic.id}
      sx={{
        display: 'flex',
        alignItems: 'center',
        p: 1,
        ml: 6,
        mb: 1,
        bgcolor: dropTarget === `topic-${topic.id}` ? 'action.selected' : 'success.light',
        borderRadius: 1,
        cursor: 'pointer',
        border: 2,
        borderColor: dropTarget === `topic-${topic.id}` ? 'primary.main' : 'transparent'
      }}
      onClick={() => onNodeSelect(topic)}
      onDragOver={(e) => handleDragOver(e, `topic-${topic.id}`)}
      onDragLeave={handleDragLeave}
      onDrop={(e) => handleDrop(e, `topic-${topic.id}`, 'topic')}
    >
      <DragHandle fontSize="small" sx={{ mr: 1, cursor: 'grab' }} />
      <Typography variant="body2" sx={{ flex: 1 }}>
        {topic.name}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {topic.questions_count || 0} Q
      </Typography>
      <IconButton size="small" onClick={(e) => { e.stopPropagation(); openTopicDialog(unitId, topic); }}>
        <Edit fontSize="small" />
      </IconButton>
      <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleMenuOpen(e, topic); }}>
        <MoreVert fontSize="small" />
      </IconButton>
    </Box>
  );

  const renderUnit = (unit: Unit, partId: number) => (
    <Box
      key={unit.id}
      sx={{
        ml: 4,
        mb: 2,
        p: 1,
        bgcolor: dropTarget === `unit-${unit.id}` ? 'action.selected' : 'info.light',
        borderRadius: 1,
        border: 2,
        borderColor: dropTarget === `unit-${unit.id}` ? 'primary.main' : 'transparent'
      }}
      onDragOver={(e) => handleDragOver(e, `unit-${unit.id}`)}
      onDragLeave={handleDragLeave}
      onDrop={(e) => handleDrop(e, `unit-${unit.id}`, 'unit')}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <IconButton size="small" onClick={() => toggleExpand(unit.id)}>
          {expandedNodes.has(unit.id) ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
        <DragHandle fontSize="small" sx={{ mr: 1, cursor: 'grab' }} />
        <Typography variant="subtitle2" sx={{ flex: 1 }}>
          {unit.name}
        </Typography>
        <IconButton size="small" onClick={() => openTopicDialog(unit.id)}>
          <Add fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={() => openUnitDialog(partId, unit)}>
          <Edit fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={(e) => handleMenuOpen(e, unit)}>
          <MoreVert fontSize="small" />
        </IconButton>
      </Box>

      {expandedNodes.has(unit.id) && (
        <Box sx={{ mt: 1 }}>
          {unit.topics?.map(t => renderTopic(t, unit.id))}
          <Box
            sx={{
              p: 2,
              border: '2px dashed',
              borderColor: dropTarget === `unit-${unit.id}-inner` ? 'primary.main' : 'divider',
              borderRadius: 1,
              textAlign: 'center',
              bgcolor: dropTarget === `unit-${unit.id}-inner` ? 'action.selected' : 'transparent'
            }}
            onDragOver={(e) => handleDragOver(e, `unit-${unit.id}-inner`)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, `unit-${unit.id}`, 'unit')}
          >
            <Typography variant="caption" color="text.secondary">
              Drag topics, questions, or tags here
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );

  const renderPart = (part: Part) => (
    <Box key={part.id} sx={{ mb: 3 }}>
      <Paper sx={{ p: 2, bgcolor: dropTarget === `part-${part.id}` ? 'action.selected' : 'secondary.light' }}
        onDragOver={(e) => handleDragOver(e, `part-${part.id}`)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, `part-${part.id}`, 'part')}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton size="small" onClick={() => toggleExpand(part.id)}>
            {expandedNodes.has(part.id) ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
          <DragHandle fontSize="small" sx={{ mr: 1, cursor: 'grab' }} />
          <Typography variant="h6" sx={{ flex: 1 }}>
            {part.name}
          </Typography>
          <IconButton size="small" onClick={() => openUnitDialog(part.id)}>
            <Add fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => openPartDialog(course?.id || 0, part)}>
            <Edit fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={(e) => handleMenuOpen(e, part)}>
            <MoreVert fontSize="small" />
          </IconButton>
        </Box>
        {part.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {part.description}
          </Typography>
        )}
      </Paper>

      {expandedNodes.has(part.id) && (
        <Box sx={{ mt: 1 }}>
          {part.units?.map(u => renderUnit(u, part.id))}
          <Box
            sx={{
              ml: 4,
              p: 2,
              border: '2px dashed',
              borderColor: 'divider',
              borderRadius: 1,
              textAlign: 'center'
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Drag units here
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );

  if (!course) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">
          Select or create a course to start building
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">
          {course.name}
        </Typography>
        <Button
          startIcon={<Add />}
          onClick={() => openPartDialog(course.id)}
          size="small"
        >
          Add Part
        </Button>
      </Box>

      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          bgcolor: dropTarget === 'course' ? 'action.selected' : 'background.paper',
          borderRadius: 1,
          border: 2,
          borderColor: dropTarget === 'course' ? 'primary.main' : 'transparent'
        }}
        onDragOver={(e) => handleDragOver(e, 'course')}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, 'course', 'course')}
      >
        {course.parts?.map(renderPart)}

        {(!course.parts || course.parts.length === 0) && (
          <Box
            sx={{
              p: 4,
              border: '2px dashed',
              borderColor: 'divider',
              borderRadius: 1,
              textAlign: 'center'
            }}
          >
            <Typography color="text.secondary">
              Drag parts or topics here to build your course
            </Typography>
          </Box>
        )}
      </Box>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          if (selectedNode) {
            if (selectedNode.level === 'part') openPartDialog(course?.id || 0, selectedNode as Part);
            else if (selectedNode.level === 'unit') openUnitDialog(0, selectedNode as Unit);
            else if (selectedNode.level === 'topic') openTopicDialog(0, selectedNode as Topic);
          }
          handleMenuClose();
        }}>
          <Edit fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDeleteNode}>
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Part Dialog */}
      <Dialog open={showPartDialog} onClose={() => setShowPartDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingNode ? 'Edit Part' : 'Create New Part'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Part Name"
              value={nodeName}
              onChange={(e) => setNodeName(e.target.value)}
              fullWidth
              autoFocus
            />
            <TextField
              label="Description"
              value={nodeDescription}
              onChange={(e) => setNodeDescription(e.target.value)}
              fullWidth
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPartDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveNode} variant="contained">
            {editingNode ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Unit Dialog */}
      <Dialog open={showUnitDialog} onClose={() => setShowUnitDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingNode ? 'Edit Unit' : 'Create New Unit'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Unit Name"
              value={nodeName}
              onChange={(e) => setNodeName(e.target.value)}
              fullWidth
              autoFocus
            />
            <TextField
              label="Description"
              value={nodeDescription}
              onChange={(e) => setNodeDescription(e.target.value)}
              fullWidth
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowUnitDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveNode} variant="contained">
            {editingNode ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Topic Dialog */}
      <Dialog open={showTopicDialog} onClose={() => setShowTopicDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingNode ? 'Edit Topic' : 'Create New Topic'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Topic Name"
              value={nodeName}
              onChange={(e) => setNodeName(e.target.value)}
              fullWidth
              autoFocus
            />
            <TextField
              label="Description"
              value={nodeDescription}
              onChange={(e) => setNodeDescription(e.target.value)}
              fullWidth
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTopicDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveNode} variant="contained">
            {editingNode ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
