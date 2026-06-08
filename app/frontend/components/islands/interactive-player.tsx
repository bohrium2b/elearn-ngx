import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import Chip from "@mui/material/Chip";
import { MultiChoice } from "../perseus/MultiChoice";
import type { MultiChoiceChoice } from "../perseus/MultiChoice";
import type { MultiChoiceRef } from "../perseus/MultiChoice";
import { useTheme } from "@mui/material";

export const tagName = "interactive-player";

interface InteractivePlayerProps {
  exerciseId: string;
  title: string;
}

interface ResolvedQuestion {
  uuid: string;
  content: string;
  options: MultiChoiceChoice[];
  hints?: string[];
}

interface QuestionResult {
  questionUuid: string;
  correct: boolean;
  score: number;
  choicesSelected?: number[];
  hintsUsed?: number;
  timeSpent?: number;
}

// ── Submit telemetry to the analytics backend ─────────────────────────────────
const submitTelemetry = async (
  exerciseId: string,
  results: QuestionResult[],
  csrfToken: string
): Promise<boolean> => {
  try {
    const exerciseResponse = await fetch(`/exercises/${exerciseId}`, {
      headers: { Accept: "application/json" },
    });
    const exerciseData = await exerciseResponse.json();
    const exerciseUuid = exerciseData.uuid || exerciseId;

    const questionResponses = results.map((r) => ({
      question_uuid: r.questionUuid,
      correct: r.correct,
      choices_selected: r.choicesSelected || [],
      hints_used: r.hintsUsed || 0,
      time_spent: r.timeSpent || 0,
    }));

    const totalQuestions = results.length;
    const correctCount = results.filter((r) => r.correct).length;

    const payload = {
      exercise_uuid: exerciseUuid,
      duration_seconds: results.reduce((sum, r) => sum + (r.timeSpent || 0), 0),
      completed_at: new Date().toISOString(),
      session_metadata: {
        source: "interactive-player",
        total_questions: totalQuestions,
        correct_count: correctCount,
        score_percentage: totalQuestions > 0
          ? Math.round((correctCount / totalQuestions) * 100)
          : 0,
      },
      question_responses: questionResponses,
    };

    const response = await fetch("/api/assessment_sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-CSRF-Token": csrfToken,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error("[InteractivePlayer] Telemetry submission failed:", response.status);
      return false;
    }

    console.log("[InteractivePlayer] Telemetry submitted successfully");
    return true;
  } catch (err) {
    console.error("[InteractivePlayer] Telemetry error:", err);
    return false;
  }
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function InteractivePlayer({
  exerciseId,
  title,
}: InteractivePlayerProps) {
  const [questions, setQuestions] = React.useState<ResolvedQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [questionResults, setQuestionResults] = React.useState<QuestionResult[]>([]);
  const [telemetrySent, setTelemetrySent] = React.useState(false);
  const theme = useTheme();
  const questionRefs = React.useRef<(MultiChoiceRef | null)[]>([]);

  // Track time spent on each question
  const questionStartTime = React.useRef<number>(Date.now());
  const timeSpentPerQuestion = React.useRef<number[]>([]);

  // Read CSRF token from meta tag
  const csrfToken = React.useMemo(
    () =>
      document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute("content") || "",
    []
  );

  React.useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await fetch(`/exercises/${exerciseId}/start`, {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        setQuestions(data.questions || []);
        // Initialize time tracking array
        timeSpentPerQuestion.current = new Array(data.questions?.length || 0).fill(0);
        questionStartTime.current = Date.now();
      } catch (error) {
        console.error("Failed to load exercise:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuestions();
  }, [exerciseId]);

  // Track time when navigating between questions
  const recordTimeForCurrentQuestion = React.useCallback(() => {
    const elapsed = Math.round((Date.now() - questionStartTime.current) / 1000);
    if (timeSpentPerQuestion.current[currentIndex] !== undefined) { timeSpentPerQuestion.current[currentIndex] += elapsed; }
    questionStartTime.current = Date.now();
  }, [currentIndex]);

  const handleSubmitAll = async () => {
    // Record time for the last question
    recordTimeForCurrentQuestion();

    // Capture scores from all questions
    const results: QuestionResult[] = questions.map((question, idx) => {
      const ref = questionRefs.current[idx];
      const score = ref?.getScore() ?? null;

      console.log(`[InteractivePlayer] Question ${idx + 1} - Score: ${score}`);

      return {
        questionUuid: question.uuid,
        correct: (score ?? 0) > 0,
        score: score ?? 0,
        choicesSelected: ref?.getSelectedChoices?.() || [],
        hintsUsed: ref?.getHintsUsed?.() || 0,
        timeSpent: timeSpentPerQuestion.current[idx] || 0,
      };
    });

    console.log("[InteractivePlayer] All results:", results);
    setQuestionResults(results);
    setIsSubmitted(true);

    // Submit telemetry to analytics backend
    if (csrfToken) {
      const sent = await submitTelemetry(exerciseId, results, csrfToken);
      setTelemetrySent(sent);
    }
  };

  const handleRestart = () => {
    // Reload the page to get a fresh exercise
    window.location.reload();
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      recordTimeForCurrentQuestion();
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      recordTimeForCurrentQuestion();
      setCurrentIndex((prev) => prev - 1);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <Typography>Loading exercise...</Typography>
      </Box>
    );
  }

  if (questions.length === 0) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <Typography>No questions available for this exercise.</Typography>
      </Box>
    );
  }

  // Calculate score for display
  const correctCount = questionResults.filter((r) => r.correct).length;
  const percentage =
    questionResults.length > 0
      ? Math.round((correctCount / questions.length) * 100)
      : 0;

  // Before submission: show one question at a time
  // After submission: show all questions with review mode
  const showAllQuestions = isSubmitted;

  return (

    <Box sx={{ width: "60%", margin: "auto", p: 2, '@media print': { backgroundColor: "white", width: "100%" } }}>
      {/* If printing, set print styles */}
      <Typography variant="h5" gutterBottom>
        {title}
      </Typography>

      {!isSubmitted && (
        <>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mb: 2,
              '@media print': { display: "none" },
            }}
          >
            <Typography variant="h6">
              Question {currentIndex + 1} of {questions.length}
            </Typography>
            <Typography variant="h6">
              Progress:{" "}
              {Math.round(((currentIndex + 1) / questions.length) * 100)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={((currentIndex + 1) / questions.length) * 100}
            sx={{ mb: 3, '@media print': { display: "none" } }}
          />
        </>
      )}

      {isSubmitted && (
        <Box
          sx={{
            textAlign: "center",
            py: 3,
            bgcolor: "action.hover",
            borderRadius: 2,
            mb: 4,
          }}
        >
          <Typography variant="h4" gutterBottom>
            Exercise Complete!
          </Typography>
          <Typography
            variant="h2"
            color={percentage >= 70 ? "success.main" : "error.main"}
          >
            {percentage}%
          </Typography>
          <Typography variant="h6">
            {correctCount} out of {questions.length} correct
          </Typography>
          {telemetrySent && (
            <Chip
              label="Results saved to analytics"
              color="success"
              size="small"
              sx={{ mt: 1 }}
            />
          )}
        </Box>
      )}

      {/* Render questions - one at a time before submit, all after submit */}
      {questions.map((question, idx) => {
        const isVisible = showAllQuestions || idx === currentIndex;
        const result = questionResults.find(
          (r) => r.questionUuid === question.uuid
        );

        return (
          <Box
            key={question.uuid}
            sx={{
              display: isVisible ? "block" : "none",
              mb: 4,
              p: 2,
              border: "1px solid #eee",
              borderRadius: 2,
              position: "relative",
              pointerEvents: isSubmitted ? "none" : "auto",
              opacity: isSubmitted ? 0.9 : 1,
              backgroundColor: theme.palette.background.paper,
              '@media print': {
                display: "block",
                border: "none",
                p: 0,
              }
            }}
          >
            {/* Question header with number and result chip */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                Question {idx + 1}
              </Typography>
              {isSubmitted && result && (
                <Chip
                  label={result.correct ? "Correct" : "Incorrect"}
                  color={result.correct ? "success" : "error"}
                  sx={{ color: "white" }}
                  size="small"
                />
              )}
            </Box>

            {/* Question content with Perseus Review mode when submitted */}
            <MultiChoice
              ref={(el) => {
                questionRefs.current[idx] = el;
              }}
              question={question.content}
              choices={question.options}
              hints={question.hints || []}
              reviewMode={isSubmitted}
            />
          </Box>
        );
      })}

      <Box
        sx={{
          display: "flex",
          gap: 2,
          justifyContent: "center",
          mt: 3,
          '@media print': { display: "none" },
        }}
      >
        {!isSubmitted ? (
          <>
            {currentIndex > 0 && (
              <Button variant="outlined" onClick={handleBack}>
                Back
              </Button>
            )}
            {currentIndex < questions.length - 1 ? (
              <Button variant="contained" onClick={handleNext}>
                Next
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleSubmitAll}
                size="large"
              >
                Submit All Answers
              </Button>
            )}
          </>
        ) : (
          <>
            <Button
              variant="outlined"
              onClick={() => (window.location.href = "/exercises")}
            >
              Back to Exercises
            </Button>
            <Button
              variant="outlined"
              onClick={() => (window.location.href = "/analytics/dashboard")}
            >
              View Analytics
            </Button>
            <Button variant="contained" onClick={handleRestart}>
              Try Again
            </Button>
          </>
        )}
      </Box>
    </Box>
  );
}
