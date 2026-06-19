import React from 'react';
import { Paper, Box, Chip } from '@mui/material';
import { Question } from '../taxonomy/types';
import Markdown from './Markdown';

interface QuestionCardProps {
    question: Question;
    onClick?: () => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ question, onClick }) => {
    return (
        <Paper
            sx={{ p: 2, cursor: onClick ? 'pointer' : 'default' }}
            onClick={onClick}
        >
            <Markdown>{question.question || ''}</Markdown>
            <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
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
        </Paper>
    );
};
