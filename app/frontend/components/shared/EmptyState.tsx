import React from "react";
import { Box, Typography, Button, Paper } from "@mui/material";
import { Refresh as RefreshIcon } from "@mui/icons-material";

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title = "Nothing here yet",
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <Paper sx={{ p: 4, textAlign: "center", borderRadius: 3 }}>
      <Typography variant="h6" color="text.secondary" gutterBottom>
        {title}
      </Typography>
      {description && (
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          {description}
        </Typography>
      )}
      {actionLabel && onAction && (
        <Button variant="contained" onClick={onAction} startIcon={<RefreshIcon />}>
          {actionLabel}
        </Button>
      )}
    </Paper>
  );
}
