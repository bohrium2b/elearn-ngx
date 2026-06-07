import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Paper,
  Alert,
  Button,
  LinearProgress,
  Grid,
} from "@mui/material";
import Markdown from "../perseus/Markdown";
import {
  CheckCircle as CorrectIcon,
  Cancel as IncorrectIcon,
  ArrowBack as BackIcon,
  AccessTime as TimeIcon,
  Lightbulb as HintIcon,
  Refresh as RetryIcon,
} from "@mui/icons-material";
import type { SessionReviewData, QuestionResponse } from "../analytics/types";

export const tagName = "session-review";

interface SessionReviewProps {
  sessionId: number;
  csrfToken: string;
}

const fetchSessionReview = async (
  sessionId: number,
  csrfToken: string
): Promise<SessionReviewData> => {
  const response = await fetch(`/analytics/${sessionId}/review`, {
    headers: {
      Accept: "application/json",
      "X-CSRF-Token": csrfToken,
    },
  });
  if (!response.ok) throw new Error("Failed to load session review");
  return response.json();
};

// ── Result Badge ───────────────────────────────────────────────────────────────
function ResultBadge({ correct }: { correct: boolean }) {
  return (
    <Chip
      label={correct ? "Correct" : "Incorrect"}
      size="small"
      icon={correct ? <CorrectIcon /> : <IncorrectIcon />}
      sx={{
        bgcolor: correct ? "success.main" : "error.main",
        color: "white",
        fontWeight: 700,
        "& .MuiChip-icon": { color: "white" },
      }}
    />
  );
}

// ── Choice Item ────────────────────────────────────────────────────────────────
function ChoiceItem({
  choice,
  wasSelected,
}: {
  choice: { content: string; correct: boolean; rationale: string | null | undefined };
  wasSelected: boolean | null | undefined;
}) {
  const isAnswer = choice.correct;
  const isWrongSelection = wasSelected && !isAnswer;

  let borderColor = "rgba(24,33,47,0.08)";
  let bgcolor = "transparent";
  let borderWidth = 1;

  if (isAnswer) {
    borderColor = "success.main";
    bgcolor = "rgba(76,175,80,0.08)";
    borderWidth = 2;
  } else if (isWrongSelection) {
    borderColor = "error.main";
    bgcolor = "rgba(244,67,54,0.08)";
    borderWidth = 2;
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        border: `${borderWidth}px solid ${borderColor}`,
        bgcolor,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 1,
        flexWrap: "wrap",
      }}
    >
      <Box sx={{ flex: 1, minWidth: 200 }}>
        <Markdown fontFamily="sans-serif">{choice.content}</Markdown>
      </Box>
      <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
        {isAnswer && (
          <Chip
            label="Correct Answer"
            size="small"
            color="success"
            variant="outlined"
          />
        )}
        {wasSelected && !isAnswer && (
          <Chip
            label="Your Answer"
            size="small"
            color="error"
            variant="outlined"
          />
        )}
        {wasSelected && isAnswer && (
          <Chip
            label="Your Answer"
            size="small"
            color="success"
            variant="outlined"
          />
        )}
      </Box>
    </Paper>
  );
}

// ── Metadata Chips ─────────────────────────────────────────────────────────────
function MetadataChips({
  hintsUsed,
  retryCount,
  timeSpent,
}: {
  hintsUsed: number | null | undefined;
  retryCount: number | null | undefined;
  timeSpent: number | null | undefined;
}) {
  return (
    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
      {hintsUsed !== undefined && hintsUsed !== null && hintsUsed > 0 && (
        <Chip
          icon={<HintIcon sx={{ fontSize: 16 }} />}
          label={`${hintsUsed} hint${hintsUsed > 1 ? "s" : ""} used`}
          size="small"
          variant="outlined"
          color="info"
        />
      )}
      {retryCount !== undefined && retryCount !== null && retryCount > 0 && (
        <Chip
          icon={<RetryIcon sx={{ fontSize: 16 }} />}
          label={`${retryCount} retry${retryCount > 1 ? "s" : ""}`}
          size="small"
          variant="outlined"
          color="warning"
        />
      )}
      {timeSpent !== undefined && timeSpent !== null && (
        <Chip
          icon={<TimeIcon sx={{ fontSize: 16 }} />}
          label={`${timeSpent}s`}
          size="small"
          variant="outlined"
        />
      )}
    </Box>
  );
}

// ── Single Question Review Card ───────────────────────────────────────────────
function QuestionReviewCard({
  response,
  index,
  total,
}: {
  response: QuestionResponse;
  index: number;
  total: number;
}) {
  const isCorrect = response.correct;

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: "1px solid rgba(24,33,47,0.12)",
        overflow: "hidden",
        transition: "box-shadow 0.2s",
        "&:hover": { boxShadow: "0 4px 20px rgba(0,0,0,0.08)" },
      }}
    >
      {/* Card Header */}
      <Box
        sx={{
          px: 2.5,
          py: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          bgcolor: isCorrect ? "success.50" : "error.50",
          borderBottom: `3px solid ${isCorrect ? "success.main" : "error.main"}`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              color: isCorrect ? "success.dark" : "error.dark",
            }}
          >
            Question {index + 1} of {total}
          </Typography>
        </Box>
        <ResultBadge correct={isCorrect} />
      </Box>

      <CardContent sx={{ p: 2.5 }}>
        {/* Question Text */}
        {response.question_text && (
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="body1"
              sx={{ fontWeight: 500, lineHeight: 1.7 }}
            >
              <Markdown fontFamily="sans-serif">{response.question_text}</Markdown>
            </Typography>
          </Box>
        )}

        {/* Choices */}
        {response.choices && response.choices.length > 0 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mb: 3 }}>
            {response.choices.map((choice, idx) => (
              <ChoiceItem
                key={idx}
                choice={choice}
                wasSelected={response.choices_selected?.includes(idx)}
              />
            ))}
          </Box>
        )}

        {/* Rationale */}
        {response.rationale && (
          <Alert
            severity="info"
            sx={{
              borderRadius: 2,
              mb: 2,
              "& .MuiAlert-message": { width: "100%" },
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
              Explanation
            </Typography>
            <Typography variant="body2">
              <Markdown fontFamily="sans-serif">{response.rationale}</Markdown>
            </Typography>
          </Alert>
        )}

        {/* Metadata */}
        <MetadataChips
          hintsUsed={response.hints_used}
          retryCount={response.retry_count}
          timeSpent={response.time_spent}
        />
      </CardContent>
    </Card>
  );
}

// ── Score Summary Card ────────────────────────────────────────────────────────
function ScoreSummaryCard({
  scorePercentage,
  correctCount,
  totalQuestions,
  durationSeconds,
  completedAt,
}: {
  scorePercentage: number;
  correctCount: number;
  totalQuestions: number;
  durationSeconds: number;
  completedAt: string;
}) {
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 4,
        border: "1px solid rgba(24,33,47,0.12)",
        bgcolor: scorePercentage >= 70 ? "success.50" : "error.50",
      }}
    >
      <Grid container spacing={3} sx={{ alignItems: "center" }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Box sx={{ textAlign: "center" }}>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                color: scorePercentage >= 70 ? "success.main" : "error.main",
              }}
            >
              {scorePercentage}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Final Score
            </Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 12, sm: 8 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <LinearProgress
              variant="determinate"
              value={scorePercentage}
              sx={{
                height: 10,
                borderRadius: 5,
                bgcolor: "rgba(0,0,0,0.08)",
                "& .MuiLinearProgress-bar": {
                  bgcolor: scorePercentage >= 70 ? "success.main" : "error.main",
                },
              }}
            />
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                flexWrap: "wrap",
                gap: 1,
              }}
            >
              <Chip
                icon={<CorrectIcon />}
                label={`${correctCount} / ${totalQuestions} correct`}
                color={scorePercentage >= 70 ? "success" : "error"}
                variant="outlined"
                size="small"
              />
              <Chip
                icon={<TimeIcon />}
                label={`${minutes}m ${seconds}s`}
                variant="outlined"
                size="small"
              />
              <Chip
                label={new Date(completedAt).toLocaleDateString()}
                variant="outlined"
                size="small"
              />
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function SessionReview({
  sessionId,
  csrfToken,
}: SessionReviewProps) {
  const [data, setData] = useState<SessionReviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchSessionReview(sessionId, csrfToken);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load review");
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, csrfToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <Typography color="text.secondary">Loading session review...</Typography>
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

  const { session } = data;
  const correctCount = session.question_responses.filter((r) => r.correct).length;
  const totalQuestions = session.question_responses.length;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        px: { xs: 2, md: 4 },
        py: { xs: 3, md: 5 },
        bgcolor: "grey.50",
      }}
    >
      <Box
        sx={{
          maxWidth: 800,
          mx: "auto",
        }}
      >
        {/* Back Button */}
        <Button
          startIcon={<BackIcon />}
          href="/analytics/dashboard"
          sx={{ textTransform: "none", mb: 2 }}
        >
          Back to Dashboard
        </Button>

        {/* Header */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, md: 4 },
            borderRadius: 4,
            border: "1px solid rgba(24,33,47,0.12)",
            boxShadow: "0 8px 32px rgba(24,33,47,0.08)",
            mb: 3,
          }}
        >
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontWeight: 800, mb: 1, textAlign: { xs: "center", sm: "left" } }}
          >
            {session.exercise_title}
          </Typography>
          <Typography
            variant="subtitle1"
            color="text.secondary"
            sx={{ mb: 3, textAlign: { xs: "center", sm: "left" } }}
          >
            Session Review
          </Typography>

          <ScoreSummaryCard
            scorePercentage={session.score_percentage}
            correctCount={correctCount}
            totalQuestions={totalQuestions}
            durationSeconds={session.duration_seconds}
            completedAt={session.completed_at}
          />
        </Paper>

        {/* Questions Section */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, px: 1 }}>
            Question Review ({totalQuestions} questions)
          </Typography>
          {session.question_responses.map((response, idx) => (
            <QuestionReviewCard
              key={response.question_uuid}
              response={response}
              index={idx}
              total={totalQuestions}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
}
