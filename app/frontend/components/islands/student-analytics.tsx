import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
  Paper,
  Alert,
  Button,
  Divider,
  Grid,
  IconButton,
  Tooltip,
  Pagination,
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  EmojiEvents as StreakIcon,
  Warning as WarningIcon,
  Lightbulb as RecommendIcon,
  History as HistoryIcon,
  Refresh as RefreshIcon,
  FitnessCenter as PracticeIcon,
} from "@mui/icons-material";
import type {
  DashboardData,
  DashboardSummary,
  LedgerEntry,
  WeakPoint,
  Recommendation,
} from "../analytics/types";

export const tagName = "student-analytics";

interface StudentAnalyticsProps {
  csrfToken: string;
}

const fetchDashboard = async (csrfToken: string): Promise<DashboardData> => {
  const response = await fetch("/analytics/dashboard", {
    headers: {
      Accept: "application/json",
      "X-CSRF-Token": csrfToken,
    },
  });
  if (!response.ok) throw new Error("Failed to load dashboard data");
  return response.json();
};

// ── Summary Card ──────────────────────────────────────────────────────────────
function SummaryCard({ summary }: { summary: DashboardSummary }) {
  const overallRate =
    summary.total_questions_answered > 0
      ? Math.round(
          (summary.total_correct / summary.total_questions_answered) * 100
        )
      : 0;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 4,
        border: "1px solid rgba(24,33,47,0.12)",
      }}
    >
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 2, textAlign: "center" }}>
        Your Performance
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
            <Typography variant="h3" sx={{ fontWeight: 800, color: "primary.main" }}>
              {summary.total_sessions}
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Sessions
            </Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                color: summary.average_score >= 70 ? "success.main" : "warning.main",
              }}
            >
              {summary.average_score}%
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Avg Score
            </Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
            <Typography variant="h3" sx={{ fontWeight: 800 }}>
              {overallRate}%
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Accuracy
            </Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
            <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 0.5 }}>
              <StreakIcon sx={{ color: "warning.main" }} />
              <Typography variant="h3" sx={{ fontWeight: 800 }}>
                {summary.current_streak}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" align="center">
              Streak
            </Typography>
          </Box>
        </Grid>
      </Grid>
      <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid rgba(0,0,0,0.08)" }}>
        <Typography variant="body2" color="text.secondary" align="center">
          Last 7 days: {summary.weekly_sessions_count} sessions {"·"}{" "}
          {summary.weekly_average_score}% avg
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center">
          Last 30 days: {summary.recent_sessions_count} sessions {"·"}{" "}
          {summary.recent_average_score}% avg
        </Typography>
      </Box>
    </Paper>
  );
}

// ── Chronological Ledger (Paginated) ──────────────────────────────────────────
function ChronologicalLedger({
  ledger,
  page,
  onPageChange,
}: {
  ledger: LedgerEntry[];
  page: number;
  onPageChange: (page: number) => void;
}) {
  if (ledger.length === 0) {
    return (
      <Alert severity="info" sx={{ borderRadius: 3 }}>
        No exercise history yet. Complete an exercise to see your progress here.
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {ledger.map((entry) => (
          <Card
            key={entry.uuid || entry.id}
            elevation={0}
            sx={{
              borderRadius: 3,
              border: "1px solid rgba(24,33,47,0.08)",
              transition: "box-shadow 0.2s",
              "&:hover": { boxShadow: "0 4px 16px rgba(0,0,0,0.08)" },
            }}
          >
            <CardContent sx={{ py: 1.5, px: 2, "&:last-child": { pb: 1.5 } }}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  gap: 2,
                  alignItems: { xs: "flex-start", sm: "center" },
                  justifyContent: "space-between",
                }}
              >
                <Box sx={{ flex: 1, minWidth: 180 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {entry.exercise_title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(entry.completed_at).toLocaleDateString()} {"·"}{" "}
                    {Math.round(entry.duration_seconds / 60)}m
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    gap: 1,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <Chip
                    label={`${entry.score_percentage}%`}
                    size="small"
                    color={entry.score_percentage >= 70 ? "success" : "error"}
                    icon={
                      entry.score_percentage >= 70 ? (
                        <TrendingUpIcon />
                      ) : (
                        <TrendingDownIcon />
                      )
                    }
                  />
                  <Typography variant="body2" color="text.secondary">
                    {entry.correct_count}/{entry.total_questions}
                  </Typography>
                  <Button
                    size="small"
                    href={entry.review_path}
                    sx={{ minWidth: 0, textTransform: "none" }}
                  >
                    Review
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
      <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
        <Pagination
          count={Math.ceil(ledger.length / 10)}
          page={page}
          onChange={(_e, value) => onPageChange(value)}
          color="primary"
        />
      </Box>
    </Box>
  );
}

// ── Weak Points Tracker (with topic names) ────────────────────────────────────
function WeakPointsTracker({ weakPoints }: { weakPoints: WeakPoint[] }) {
  if (weakPoints.length === 0) {
    return (
      <Alert severity="success" sx={{ borderRadius: 3 }}>
        No weak points detected. Keep up the great work!
      </Alert>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {weakPoints.map((wp) => (
        <Card
          key={wp.question_uuid}
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "1px solid rgba(24,33,47,0.08)",
          }}
        >
          <CardContent sx={{ py: 1.5, px: 2, "&:last-child": { pb: 1.5 } }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 2,
                alignItems: { xs: "flex-start", sm: "center" },
                justifyContent: "space-between",
              }}
            >
              <Box sx={{ flex: 1, minWidth: 180 }}>
                <Box sx={{ display: "flex", flexDirection: "row", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                  <WarningIcon sx={{ color: "warning.main", fontSize: 18 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {wp.tags.length > 0 ? wp.tags.join(", ") : "Unknown Topic"}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {wp.attempts} attempts {"·"} {wp.correct} correct
                </Typography>
              </Box>
              <Box sx={{ display: "flex", flexDirection: "row", gap: 1, alignItems: "center" }}>
                <LinearProgress
                  variant="determinate"
                  value={wp.success_rate}
                  sx={{
                    width: 80,
                    height: 8,
                    borderRadius: 4,
                    bgcolor: "rgba(0,0,0,0.08)",
                    "& .MuiLinearProgress-bar": {
                      bgcolor:
                        wp.success_rate < 30 ? "error.main" : "warning.main",
                    },
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 700, minWidth: 40, textAlign: "right" }}
                >
                  {wp.success_rate}%
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}

// ── Recommendations (Custom Exercises) ────────────────────────────────────────
function RecommendationsList({
  recommendations,
}: {
  recommendations: Recommendation[];
}) {
  if (recommendations.length === 0) {
    return (
      <Alert severity="info" sx={{ borderRadius: 3 }}>
        No recommendations available. You've attempted all available questions
        in your weak areas.
      </Alert>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {recommendations.map((rec) => (
        <Card
          key={rec.type === "custom_exercise" ? rec.title : rec.question_uuid}
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "1px solid rgba(24,33,47,0.08)",
            transition: "box-shadow 0.2s",
            "&:hover": { boxShadow: "0 4px 16px rgba(0,0,0,0.08)" },
          }}
        >
          <CardContent sx={{ py: 1.5, px: 2, "&:last-child": { pb: 1.5 } }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 2,
                alignItems: { xs: "flex-start", sm: "center" },
                justifyContent: "space-between",
              }}
            >
              <Box sx={{ flex: 1, minWidth: 180 }}>
                <Box sx={{ display: "flex", flexDirection: "row", gap: 1, alignItems: "center" }}>
                  <RecommendIcon sx={{ color: "primary.main", fontSize: 18 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {rec.type === "custom_exercise" ? rec.title : (rec.config_preview || "Practice Question")}
                  </Typography>
                </Box>
                {rec.type === "custom_exercise" && (
                  <Typography variant="caption" color="text.secondary">
                    {rec.description}
                  </Typography>
                )}
                {rec.tags && rec.tags.length > 0 && (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "row",
                      gap: 0.5,
                      mt: 0.5,
                      flexWrap: "wrap",
                    }}
                  >
                    {rec.tags.map((tag) => (
                      <Chip
                        key={tag.uuid}
                        label={tag.name}
                        size="small"
                        variant="outlined"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                  </Box>
                )}
              </Box>
              {rec.type === "custom_exercise" ? (
                <Button
                  variant="contained"
                  size="small"
                  href={rec.exercise_path}
                  sx={{ textTransform: "none" }}
                  startIcon={<PracticeIcon />}
                >
                  Start Practice
                </Button>
              ) : (
                <Button
                  variant="contained"
                  size="small"
                  href={`/questions/${rec.question_uuid}`}
                  sx={{ textTransform: "none" }}
                >
                  Practice
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function StudentAnalytics({ csrfToken }: StudentAnalyticsProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"ledger" | "weak" | "recommend">("ledger");
  const [ledgerPage, setLedgerPage] = useState(1);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchDashboard(csrfToken);
      setData(result);
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
        <Typography color="text.secondary">Loading your analytics...</Typography>
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

  if (!data) return null;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        px: { xs: 2, md: 4 },
        py: { xs: 3, md: 5 },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          maxWidth: 960,
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
              Your Analytics
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
            {/* Summary */}
            <SummaryCard summary={data.summary} />

            {/* Tab Navigation */}
            <Box>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  gap: 1,
                  flexWrap: "wrap",
                }}
              >
                <Button
                  variant={activeTab === "ledger" ? "contained" : "outlined"}
                  startIcon={<HistoryIcon />}
                  onClick={() => setActiveTab("ledger")}
                  sx={{ textTransform: "none" }}
                >
                  History
                </Button>
                <Button
                  variant={activeTab === "weak" ? "contained" : "outlined"}
                  startIcon={<WarningIcon />}
                  onClick={() => setActiveTab("weak")}
                  sx={{ textTransform: "none" }}
                >
                  Weak Points
                </Button>
                <Button
                  variant={activeTab === "recommend" ? "contained" : "outlined"}
                  startIcon={<RecommendIcon />}
                  onClick={() => setActiveTab("recommend")}
                  sx={{ textTransform: "none" }}
                >
                  Recommendations
                </Button>
              </Box>
            </Box>

            <Divider />

            {/* Tab Content */}
            {activeTab === "ledger" && (
              <ChronologicalLedger
                ledger={data.ledger}
                page={ledgerPage}
                onPageChange={setLedgerPage}
              />
            )}
            {activeTab === "weak" && (
              <WeakPointsTracker weakPoints={data.weak_points} />
            )}
            {activeTab === "recommend" && (
              <RecommendationsList recommendations={data.recommendations} />
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
