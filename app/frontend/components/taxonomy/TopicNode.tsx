/**
 * TopicNode.tsx – Component for displaying a topic in the learning pathway
 *
 * Shows topic information with status indicators (completed, active, locked)
 * and action buttons for starting topics.
 */

import React from 'react';
import { Box, Typography, Chip, IconButton } from '@mui/material';
import { 
  CheckCircle, 
  Lock, 
  PlayCircleOutlined, 
  AccessTime
} from '@mui/icons-material';
import { Topic } from './types';

interface TopicNodeProps {
  topic: Topic;
  status: 'completed' | 'active' | 'locked';
  onStart?: () => void;
}

export const TopicNode: React.FC<TopicNodeProps> = ({ topic, status, onStart }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'completed': return 'success';
      case 'active': return 'primary';
      case 'locked': return 'default';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'completed': return <CheckCircle color="success" />;
      case 'active': return <PlayCircleOutlined color="primary" />;
      case 'locked': return <Lock color="disabled" />;
    }
  };

  return (
    <Box
      sx={{
        position: 'relative',
        p: 2,
        mb: 2,
        borderRadius: 2,
        border: 2,
        borderColor: `${getStatusColor()}.main`,
        backgroundColor: status === 'locked' ? 'action.hover' : 'background.paper',
        opacity: status === 'locked' ? 0.6 : 1,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        {getStatusIcon()}
        <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
          {topic.name}
        </Typography>
      </Box>
      
      {topic.description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {topic.description}
        </Typography>
      )}
      
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
        <Chip
          icon={<AccessTime fontSize="small" />}
          label={`${topic.questions_count || 0} questions`}
          size="small"
          variant="outlined"
        />
        
        {topic.tags?.map(tag => (
          <Chip
            key={tag.id}
            label={tag.name}
            size="small"
            sx={{
              backgroundColor: tag.color || 'primary.main',
              color: 'white'
            }}
          />
        ))}
      </Box>
      
      {status === 'active' && onStart && (
        <Box sx={{ mt: 2 }}>
          <IconButton
            color="primary"
            onClick={onStart}
            sx={{
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%': { boxShadow: '0 0 0 0 rgba(25, 118, 210, 0.7)' },
                '70%': { boxShadow: '0 0 0 10px rgba(25, 118, 210, 0)' },
                '100%': { boxShadow: '0 0 0 0 rgba(25, 118, 210, 0)' },
              }
            }}
          >
            <PlayCircleOutlined fontSize="large" />
          </IconButton>
          <Typography variant="caption" color="primary" sx={{ display: 'block' }}>
            START
          </Typography>
        </Box>
      )}
    </Box>
  );
};
