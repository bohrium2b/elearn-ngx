/**
 * LibraryBrowser.tsx – Hierarchical browser for the course library
 *
 * Displays courses, parts, units, and topics in a collapsible tree structure.
 * Allows navigation to individual topics.
 */

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemText,
  Collapse,
  IconButton,
  Chip,
  LinearProgress
} from '@mui/material';
import { ExpandMore, ExpandLess, Folder, FolderOpen, Description } from '@mui/icons-material';
import { Course, Part, Unit, Topic } from './types';
import { taxonomyApi } from './api';

interface LibraryBrowserProps {
  onTopicSelect?: (topic: Topic) => void;
}

export const LibraryBrowser: React.FC<LibraryBrowserProps> = ({ onTopicSelect }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const data = await taxonomyApi.getTree();
      setCourses(data);
    } catch (error) {
      console.error('Failed to load courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const renderTopic = (topic: Topic) => (
    <ListItem
      key={topic.id}
      disablePadding
      sx={{ pl: 8 }}
      secondaryAction={
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Chip label={`${topic.questions_count || 0} Q`} size="small" />
        </Box>
      }
    >
      <ListItemButton onClick={() => onTopicSelect?.(topic)}>
        <Description sx={{ mr: 1, color: 'success.main' }} fontSize="small" />
        <ListItemText
          primary={topic.name}
          secondary={topic.description}
        />
      </ListItemButton>
    </ListItem>
  );

  const renderUnit = (unit: Unit) => (
    <Box key={unit.id}>
      <ListItem disablePadding sx={{ pl: 6 }}>
        <ListItemButton onClick={() => toggleExpand(`unit-${unit.id}`)}>
          {expandedNodes.has(`unit-${unit.id}`) ? <ExpandLess /> : <ExpandMore />}
          <Folder sx={{ mr: 1, color: 'info.main' }} fontSize="small" />
          <ListItemText primary={unit.name} />
        </ListItemButton>
      </ListItem>
      <Collapse in={expandedNodes.has(`unit-${unit.id}`)}>
        <List component="div" disablePadding>
          {unit.topics?.map(renderTopic)}
        </List>
      </Collapse>
    </Box>
  );

  const renderPart = (part: Part) => (
    <Box key={part.id}>
      <ListItem disablePadding sx={{ pl: 4 }}>
        <ListItemButton onClick={() => toggleExpand(`part-${part.id}`)}>
          {expandedNodes.has(`part-${part.id}`) ? <ExpandLess /> : <ExpandMore />}
          <FolderOpen sx={{ mr: 1, color: 'secondary.main' }} fontSize="small" />
          <ListItemText primary={part.name} />
        </ListItemButton>
      </ListItem>
      <Collapse in={expandedNodes.has(`part-${part.id}`)}>
        <List component="div" disablePadding>
          {part.units?.map(renderUnit)}
        </List>
      </Collapse>
    </Box>
  );

  const renderCourse = (course: Course) => (
    <Box key={course.id} sx={{ mb: 2 }}>
      <ListItem disablePadding sx={{ pl: 2 }}>
        <ListItemButton onClick={() => toggleExpand(`course-${course.id}`)}>
          {expandedNodes.has(`course-${course.id}`) ? <ExpandLess /> : <ExpandMore />}
          <FolderOpen sx={{ mr: 1, color: 'primary.main' }} />
          <ListItemText
            primary={course.name}
            secondary={course.description}
          />
        </ListItemButton>
      </ListItem>
      <Collapse in={expandedNodes.has(`course-${course.id}`)}>
        <List component="div" disablePadding>
          {course.parts?.map(renderPart)}
        </List>
      </Collapse>
    </Box>
  );

  if (loading) {
    return <LinearProgress />;
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Course Library
      </Typography>
      <List>
        {courses.map(renderCourse)}
      </List>
    </Box>
  );
};
