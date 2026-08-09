import React from "react";
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Alert,
} from "@mui/material";
import { Refresh as RefreshIcon } from "@mui/icons-material";

export const DASHBOARD_SHELL_SX = {
  page: {
    minHeight: "100vh",
    px: { xs: 2, md: 4 },
    py: { xs: 3, md: 5 },
  },
  paper: {
    elevation: 0 as number,
    borderRadius: 5,
    border: "1px solid rgba(24,33,47,0.12)",
    boxShadow: "0 24px 64px rgba(24,33,47,0.08)",
    overflow: "hidden",
  },
  header: {
    px: { xs: 2, md: 4 },
    py: { xs: 2, md: 3 },
    borderBottom: "1px solid rgba(24,33,47,0.08)",
    background: "rgba(255,255,255,0.88)",
  },
  headerRow: {
    display: "flex",
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
  },
  body: {
    px: { xs: 2, md: 4 },
    py: { xs: 2.5, md: 4 },
  },
} as const;

interface DashboardShellProps {
  title: string;
  onRefresh?: () => void;
  maxWidth?: number | string;
  loading?: boolean;
  loadingText?: string;
  error?: unknown;
  children: React.ReactNode;
}

export function DashboardShell({
  title,
  onRefresh,
  maxWidth = 960,
  loading = false,
  loadingText = "Loading…",
  error,
  children,
}: DashboardShellProps) {
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <Typography color="text.secondary">{loadingText}</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ borderRadius: 3 }}>
        {error instanceof Error ? error.message : String(error)}
      </Alert>
    );
  }

  return (
    <Box sx={DASHBOARD_SHELL_SX.page}>
      <Paper sx={{ ...DASHBOARD_SHELL_SX.paper, maxWidth, mx: "auto" }}>
        <Box sx={DASHBOARD_SHELL_SX.header}>
          <Box sx={DASHBOARD_SHELL_SX.headerRow}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 800 }}>
              {title}
            </Typography>
            {onRefresh && (
              <Tooltip title="Refresh">
                <IconButton onClick={onRefresh} size="small">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
        <Box sx={DASHBOARD_SHELL_SX.body}>{children}</Box>
      </Paper>
    </Box>
  );
}
