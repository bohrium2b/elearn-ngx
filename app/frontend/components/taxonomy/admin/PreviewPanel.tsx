import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Chip, 
  Divider
} from '@mui/material';
import { TaxonomyNode, Question } from '../types';

interface PreviewPanelProps {
  node: TaxonomyNode | null;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({ node }) => {
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
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      <Typography variant="h6" gutterBottom>
        Preview: {node.name}
      </Typography>
      
      <Paper sx={{ p: 2, mb: 2 }}>
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
      
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Statistics
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
          <Box>
            <Typography variant="h6">{node.children_count || 0}</Typography>
            <Typography variant="caption">Children</Typography>
          </Box>
          <Box>
            <Typography variant="h6">{node.questions_count || 0}</Typography>
            <Typography variant="caption">Questions</Typography>
          </Box>
        </Box>
      </Paper>
      
      {node.questions && node.questions.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Questions
          </Typography>
          {node.questions.slice(0, 5).map((q: Question, index: number) => (
            <Box key={q.id} sx={{ py: 1 }}>
              <Typography variant="body2">
                {q.question?.substring(0, 100)}...
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                {q.tags?.map(tag => (
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
              {index < 4 && node.questions!.length > 1 && <Divider sx={{ mt: 1 }} />}
            </Box>
          ))}
          {node.questions.length > 5 && (
            <Typography variant="caption" color="text.secondary">
              +{node.questions.length - 5} more questions
            </Typography>
          )}
        </Paper>
      )}
    </Box>
  );
};
