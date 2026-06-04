import { Box, Button, Typography } from "@mui/material";
import React from "react";

type EmptyStateProps = {
    icon?: React.ReactNode;
    message: string;
    submessage?: string;
    action?: { label: string; onClick: () => void };
};

export function EmptyState({
    icon,
    message,
    submessage,
    action,
}: EmptyStateProps): React.JSX.Element {
    return (
        <Box
            sx={{
                py: 6,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
            }}
        >
            {icon && <Box sx={{ mb: 2, color: "text.disabled" }}>{icon}</Box>}
            <Typography variant="body1" color="text.secondary" sx={{ mb: 0.5 }}>
                {message}
            </Typography>
            {submessage && (
                <Typography variant="caption" color="text.disabled">
                    {submessage}
                </Typography>
            )}
            {action && (
                <Button
                    variant="outlined"
                    size="small"
                    onClick={action.onClick}
                    sx={{ mt: 2 }}
                >
                    {action.label}
                </Button>
            )}
        </Box>
    );
}
