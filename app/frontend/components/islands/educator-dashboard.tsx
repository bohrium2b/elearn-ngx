import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Typography,
  Chip,
  Paper,
  Alert,
  Button,
  Divider,
  Grid,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  IconButton,
} from "@mui/material";
import {
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import type {
  CohortMetrics,
  TagMatrixNode,
  ItemDiscrimination,
} from "../analytics/types";

export const tagName = "educator-dashboard";

interface EducatorDashboardProps {
  csrfToken: string;
}

const fetchCohortMetrics = async (csrfToken: string): Promise<CohortMetrics> => {
  const response = await fetch("/analytics/cohort", {
    headers: {
      Accept: "application/json",
      "X-CSRF-Token": csrfToken,
    },
  });
  if (!response.ok) throw new Error("Failed to load cohort metrics");
  return response.json().then((d) => d.cohort);
};

const fetchTagMatrix = async (
  csrfToken: string
): Promise<TagMatrixNode[]> => {
  const response = await fetch("/analytics/tag_matrix", {
    headers: {
      Accept: "application/json",
      "X-CSRF-Token": csrfToken,
    },
  });
  if (!response.ok) throw new Error("Failed to load tag matrix");
  return response.json().then((d) => d.tag_matrix);
};

const fetchItemDiscrimination = async (
  csrfToken: string
): Promise<ItemDiscrimination[]> => {
  const response = await fetch("/analytics/item_discrimination", {
    headers: {
      Accept: "application/json",
      "X-CSRF-Token": csrfToken,
    },
  });
  if (!response.ok) throw new Error("Failed to load item discrimination");
  return response.json().then((d) => d.items);
};

// ── Grade Distribution Bar ────────────────────────────────────────────────────
function GradeBar({
  label,
  count,
  total,
}: {
  label: string;
  count: number;
  total: number;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  const color =
    label.startsWith("A") || label.startsWith("B")
      ? "success.main"
      : label.startsWith("C") || label.startsWith("D")
        ? "warning.main"
        : "error.main";

  return (
    <Box sx={{ mb: 1 }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 0.5,
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {label}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {count} ({pct.toFixed(1)}%)
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{
          height: 10,
          borderRadius: 5,
          bgcolor: "rgba(0,0,0,0.06)",
          "& .MuiLinearProgress-bar": { bgcolor: color },
        }}
      />
    </Box>
  );
}

// ── Tag Matrix Tree ───────────────────────────────────────────────────────────
function TagMatrixTree({ nodes, depth = 0 }: { nodes: TagMatrixNode[]; depth?: number }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {nodes.map((node) => (
        <Box key={node.uuid} sx={{ ml: depth * 3 }}>
          <Paper
            elevation={0}
            sx={{
              p: 1.5,
              borderRadius: 2,
              border: "1px solid rgba(24,33,47,0.08)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            <Box sx={{ display: "flex", flexDirection: "row", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: 999,
                  bgcolor: node.color,
                  flexShrink: 0,
                }}
              />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {node.name}
              </Typography>
              <Chip
                label={`${node.total_responses} responses`}
                size="small"
                variant="outlined"
              />
            </Box>
            <Box sx={{ display: "flex", flexDirection: "row", gap: 1, alignItems: "center" }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  color:
                    node.average_score >= 70
                      ? "success.main"
                      : node.average_score >= 50
                        ? "warning.main"
                        : "error.main",
                }}
              >
                {node.average_score}%
              </Typography>
              {node.average_score >= 70 ? (
                <TrendingUpIcon sx={{ fontSize: 16, color: "success.main" }} />
              ) : (
                <TrendingDownIcon sx={{ fontSize: 16, color: "error.main" }} />
              )}
            </Box>
          </Paper>
          {node.children && node.children.length > 0 && (
            <TagMatrixTree nodes={node.children} depth={depth + 1} />
          )}
        </Box>
      ))}
    </Box>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function EducatorDashboard({
  csrfToken,
}: EducatorDashboardProps) {
  const [cohort, setCohort] = useState<CohortMetrics | null>(null);
  const [tagMatrix, setTagMatrix] = useState<TagMatrixNode[]>([]);
  const [items, setItems] = useState<ItemDiscrimination[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"cohort" | "tags" | "items">("cohort");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [cohortData, tagData, itemData] = await Promise.all([
        fetchCohortMetrics(csrfToken),
        fetchTagMatrix(csrfToken),
        fetchItemDiscrimination(csrfToken),
      ]);
      setCohort(cohortData);
      setTagMatrix(tagData);
      setItems(itemData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, [csrfToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <Typography color="text.secondary">
          Loading educator analytics...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ borderRadius: 3 }}>
        {error}
      </Alert>
    );
  }

  const flaggedItems = items.filter((i) => i.flagged);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        px: { xs: 2, md: 4 },
        py: { xs: 3, md: 5 },
        background:
          "radial-gradient(circle at top left, rgba(108,122,137,0.08), transparent 34%), linear-gradient(180deg, #faf7f2 0%, #eef1f5 100%)",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          maxWidth: 1100,
          mx: "auto",
          borderRadius: 5,
          border: "1px solid rgba(24,33,47,0.12)",
          boxShadow: "0 24px 64px rgba(24,33,47,0.08)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: { xs: 2, md: 4 },
            py: { xs: 2, md: 3 },
            borderBottom: "1px solid rgba(24,33,47,0.08)",
            background: "rgba(255,255,255,0.88)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h4" component="h1" sx={{ fontWeight: 800 }}>
              Educator Dashboard
            </Typography>
            <Tooltip title="Refresh">
              <IconButton onClick={loadData} size="small">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Box sx={{ px: { xs: 2, md: 4 }, py: { xs: 2.5, md: 4 } }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Tab Navigation */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                gap: 1,
                flexWrap: "wrap",
              }}
            >
              <Button
                variant={activeTab === "cohort" ? "contained" : "outlined"}
                onClick={() => setActiveTab("cohort")}
                sx={{ textTransform: "none" }}
              >
                Cohort Monitor
              </Button>
              <Button
                variant={activeTab === "tags" ? "contained" : "outlined"}
                onClick={() => setActiveTab("tags")}
                sx={{ textTransform: "none" }}
              >
                Tag Matrix
              </Button>
              <Button
                variant={activeTab === "items" ? "contained" : "outlined"}
                onClick={() => setActiveTab("items")}
                sx={{ textTransform: "none" }}
              >
                Item Discrimination
                {flaggedItems.length > 0 && (
                  <Chip
                    label={flaggedItems.length}
                    size="small"
                    color="warning"
                    sx={{ ml: 1, color: "white" }}
                  />
                )}
              </Button>
            </Box>

            <Divider />

            {/* Cohort Monitor */}
            {activeTab === "cohort" && cohort && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 3,
                        textAlign: "center",
                        border: "1px solid rgba(24,33,47,0.08)",
                      }}
                    >
                      <Typography variant="h4" sx={{ fontWeight: 800 }}>
                        {cohort.total_sessions}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Sessions
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 3,
                        textAlign: "center",
                        border: "1px solid rgba(24,33,47,0.08)",
                      }}
                    >
                      <Typography variant="h4" sx={{ fontWeight: 800 }}>
                        {cohort.unique_students}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Students
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 3,
                        textAlign: "center",
                        border: "1px solid rgba(24,33,47,0.08)",
                      }}
                    >
                      <Typography
                        variant="h4"
                        sx={{
                          fontWeight: 800,
                          color:
                            cohort.average_score >= 70
                              ? "success.main"
                              : "warning.main",
                        }}
                      >
                        {cohort.average_score}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Avg Score
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 3,
                        textAlign: "center",
                        border: "1px solid rgba(24,33,47,0.08)",
                      }}
                    >
                      <Typography variant="h4" sx={{ fontWeight: 800 }}>
                        {Math.round(cohort.average_duration_seconds / 60)}m
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Avg Duration
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>

                {/* Grade Distribution */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    border: "1px solid rgba(24,33,47,0.08)",
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, textAlign: "center" }}>
                    Grade Distribution
                  </Typography>
                  {Object.entries(cohort.grade_distribution).map(
                    ([label, count]) => (
                      <GradeBar
                        key={label}
                        label={label}
                        count={count}
                        total={cohort.total_sessions}
                      />
                    )
                  )}
                </Paper>
              </Box>
            )}

            {/* Tag Matrix */}
            {activeTab === "tags" && (
              <Box>
                {tagMatrix.length === 0 ? (
                  <Alert severity="info" sx={{ borderRadius: 3 }}>
                    No tag data available yet.
                  </Alert>
                ) : (
                  <TagMatrixTree nodes={tagMatrix} />
                )}
              </Box>
            )}

            {/* Item Discrimination */}
            {activeTab === "items" && (
              <Box>
                {flaggedItems.length > 0 && (
                  <Alert
                    severity="warning"
                    sx={{ borderRadius: 3, mb: 2 }}
                    icon={<WarningIcon />}
                  >
                    {flaggedItems.length} question
                    {flaggedItems.length > 1 ? "s" : ""} flagged with high failure
                    rates.
                  </Alert>
                )}
                {items.length === 0 ? (
                  <Alert severity="info" sx={{ borderRadius: 3 }}>
                    No item data available yet.
                  </Alert>
                ) : (
                  <TableContainer
                    component={Paper}
                    elevation={0}
                    sx={{
                      borderRadius: 3,
                      border: "1px solid rgba(24,33,47,0.08)",
                    }}
                  >
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Question ID</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>
                            Attempts
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>
                            Correct
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>
                            Failure Rate
                          </TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700 }}>
                            Status
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {items.slice(0, 50).map((item) => (
                          <TableRow
                            key={item.question_uuid}
                            sx={{
                              bgcolor: item.flagged
                                ? "rgba(255,152,0,0.06)"
                                : "transparent",
                            }}
                          >
                            <TableCell>
                              <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                                {item.question_uuid.slice(0, 12)}...
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              {item.total_attempts}
                            </TableCell>
                            <TableCell align="right">
                              {item.correct_count}
                            </TableCell>
                            <TableCell align="right">
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 700,
                                  color:
                                    item.failure_rate >= 70
                                      ? "error.main"
                                      : item.failure_rate >= 40
                                        ? "warning.main"
                                        : "success.main",
                                }}
                              >
                                {item.failure_rate}%
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              {item.flagged ? (
                                <Chip
                                  label="Flagged"
                                  size="small"
                                  color="warning"
                                  icon={<WarningIcon />}
                                />
                              ) : (
                                <Chip
                                  label="OK"
                                  size="small"
                                  color="success"
                                  variant="outlined"
                                />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
