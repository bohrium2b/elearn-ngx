import { Box, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import React from "react";
import type { TagNode, DragPayload } from "./types";
import { getTotalQuestionsCount } from "./utils";

type SubtagCardProps = {
    tag: TagNode;
    onSelect: () => void;
    onDrop: (tagId: number, payload: DragPayload) => void;
};

export function SubtagCard({
    tag,
    onSelect,
    onDrop,
}: SubtagCardProps): React.JSX.Element {
    return (
        <Card
            elevation={0}
            data-testid={`tag-drop-zone-${tag.id}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
                e.preventDefault();
                const raw = e.dataTransfer.getData("application/json");
                if (!raw) return;
                onDrop(tag.id, JSON.parse(raw) as DragPayload);
            }}
            sx={{
                height: "100%",
                border: 1,
                borderColor: "divider",
                borderLeft: 4,
                borderLeftColor: tag.color,
                cursor: "pointer",
                transition: "all 0.2s ease",
                "&:hover": {
                    borderColor: tag.color,
                    boxShadow: 2,
                    transform: "translateY(-2px)",
                },
            }}
            onClick={onSelect}
        >
            <CardContent sx={{ p: 2 }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
                    <Box
                        sx={{
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            bgcolor: tag.color,
                        }}
                    />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {tag.name}
                    </Typography>
                    <Chip
                        label={getTotalQuestionsCount(tag)}
                        size="small"
                        sx={{ ml: "auto" }}
                    />
                </Stack>

                {/* Preview questions */}
                {tag.questions.length > 0 && (
                    <Stack spacing={0.5} sx={{ mt: 1 }}>
                        {tag.questions.slice(0, 2).map((q) => (
                            <Typography
                                key={q.id}
                                variant="caption"
                                color="text.secondary"
                                noWrap
                            >
                                {q.label}
                            </Typography>
                        ))}
                        {tag.questions.length > 2 && (
                            <Typography variant="caption" color="primary">
                                +{tag.questions.length - 2} more
                            </Typography>
                        )}
                    </Stack>
                )}

                {tag.questions.length === 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        No questions yet
                    </Typography>
                )}
            </CardContent>
        </Card>
    );
}
