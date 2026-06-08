/**
 * CourseCard.tsx – Card component for displaying course information
 *
 * Shows course name, description, statistics, and progress indicator.
 */

import React from 'react';
import { Card, CardContent, Typography, Box, Chip, LinearProgress } from '@mui/material';
import { School, MenuBook, Topic, Quiz } from '@mui/icons-material';
import { Course } from './types';

interface CourseCardProps {
  course: Course;
  progress?: { completed: number; total: number };
  onClick: () => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course, progress, onClick }) => {
  const progressPercentage = progress 
    ? Math.round((progress.completed / progress.total) * 100) 
    : 0;

  return (
    <Card 
      sx={{ 
        cursor: 'pointer', 
        '&:hover': { boxShadow: 6 },
        transition: 'box-shadow 0.3s'
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <School color="primary" />
          <Typography variant="h6" component="h2">
            {course.name}
          </Typography>
        </Box>
        
        {course.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {course.description}
          </Typography>
        )}
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          <Chip
            icon={<MenuBook fontSize="small" />}
            label={`${course.parts_count || 0} Parts`}
            size="small"
            variant="outlined"
          />
          <Chip
            icon={<Topic fontSize="small" />}
            label={`${course.topics_count || 0} Topics`}
            size="small"
            variant="outlined"
          />
          <Chip
            icon={<Quiz fontSize="small" />}
            label={`${course.questions_count || 0} Questions`}
            size="small"
            variant="outlined"
          />
        </Box>
        
        {progress && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Progress
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {progressPercentage}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={progressPercentage} 
              sx={{ height: 8, borderRadius: 1 }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
