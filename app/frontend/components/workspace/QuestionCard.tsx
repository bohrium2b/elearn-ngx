import { Card, CardContent, Typography } from "@mui/material";
import React from "react";
import type { QuestionNode, DragPayload } from "./types";

type QuestionCardProps = {
    question: QuestionNode;
    onDragStart: (payload: DragPayload) => void;
    onClick: (question: QuestionNode) => void;
};

export function QuestionCard({
    question,
    onDragStart,
    onClick,
}: QuestionCardProps): React.JSX.Element {
    return (
        <Card
            data-testid={`question-card-${question.id}`}
            elevation={0}
            draggable
            onDragStart={(event) => {
                const payload: DragPayload = {
                    questionId: question.id,
                    sourceTagId: question.source_tag_id ?? null,
                };
                event.dataTransfer.setData("application/json", JSON.stringify(payload));
                onDragStart(payload);
            }}
            onClick={() => onClick(question)}
            sx={{
                height: "100%",
                border: 1,
                borderColor: "divider",
                cursor: "grab",
                transition: "all 0.2s ease",
                "&:hover": {
                    borderColor: "primary.main",
                    boxShadow: 2,
                },
                "&:active": {
                    cursor: "grabbing",
                },
            }}
        >
            <CardContent sx={{ p: 2 }}>
                <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, mb: 0.5 }}
                    noWrap
                >
                    {question.label}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                    {question.slug}
                </Typography>
            </CardContent>
        </Card>
    );
}
