import React from "react";
import { Box, Typography } from "@mui/material";

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Loading..." }: LoadingStateProps) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <Typography color="text.secondary">{message}</Typography>
    </Box>
  );
}
