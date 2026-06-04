import { Add } from "@mui/icons-material";
import { Card, Stack, Typography } from "@mui/material";
import React from "react";

type AddQuestionCardProps = {
    onClick: () => void;
};

export function AddQuestionCard({ onClick }: AddQuestionCardProps): React.JSX.Element {
    return (
        <Card
            elevation={0}
            onClick={onClick}
            data-testid="add-question-card"
            sx={{
                height: "100%",
                minHeight: 100,
                border: 2,
                borderStyle: "dashed",
                borderColor: "divider",
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                "&:hover": {
                    borderColor: "primary.main",
                    bgcolor: "primary.main",
                    bgcolorOpacity: 0.04,
                },
            }}
        >
            <Stack sx={{ alignItems: "center" }} spacing={1}>
                <Add sx={{ fontSize: 32, color: "text.secondary" }} />
                <Typography variant="body2" color="text.secondary">
                    Add Question
                </Typography>
            </Stack>
        </Card>
    );
}
