import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  LinearProgress,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Fade,
  Zoom,
  Alert,
} from "@mui/material";
import {
  Close,
  Favorite,
  LocalFireDepartment,
  EmojiEvents,
  SkipNext,
  Lightbulb,
  ArrowBack,
  Replay,
  CheckCircle,
  Cancel,
} from "@mui/icons-material";
import { QuestionRenderer } from "../perseus/QuestionRenderer";
import { getCsrfToken } from "../lib/getCsrfToken";
import { learningPathwaysApi } from "../taxonomy/api";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TopicPlayerProps {
  topicId: string;
  topicName: string;
}

interface ResolvedQuestion {
  uuid: string;
  content: string;
  options: Array<{ content: string; correct: boolean; rationale?: string }>;
  hints: string[];
  numChoices: number;
  type: string;
}

interface QuestionResponse {
  question_uuid: string;
  correct: boolean;
  score: number;
  choices_selected?: number[];
  hints_used?: number;
  time_spent: number;
}

interface GamificationStatus {
  streak: number;
  hearts: number;
}

type PlayerState = "idle" | "selected" | "feedback" | "complete";

// ── Component ─────────────────────────────────────────────────────────────────

export const tagName = "topic-player";

export default function TopicPlayer({ topicId, topicName }: TopicPlayerProps) {
  const [questions, setQuestions] = useState<ResolvedQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [state, setState] = useState<PlayerState>("idle");
  const [hearts, setHearts] = useState(5);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [telemetrySent, setTelemetrySent] = useState(false);
  const [questionResponses, setQuestionResponses] = useState<QuestionResponse[]>([]);
  const [gamification, setGamification] = useState<GamificationStatus>({ streak: 0, hearts: 5 });
  const [courseId, setCourseId] = useState<string | null>(null);
  const [exerciseUuid, setExerciseUuid] = useState<string>("");

  const questionRef = useRef<{ getScore: () => number | null }>(null);
  const questionStartTime = useRef(Date.now());
  const timeSpentPerQuestion = useRef<number[]>([]);

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  // ── Data loading ──────────────────────────────────────────────────────────

  useEffect(() => {
    const loadData = async () => {
      try {
        const [playRes, gamificationRes] = await Promise.all([
          fetch(`/taxonomy/${topicId}/play.json`, {
            headers: { Accept: "application/json" },
          }),
          fetch("/api/gamification/status", {
            headers: { Accept: "application/json" },
          }).catch(() =>
            new Response(JSON.stringify({ streak: 0, hearts: 5 }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            })
          ),
        ]);

        if (!playRes.ok) {
          throw new Error(`Failed to load topic: ${playRes.status}`);
        }

        const playData = await playRes.json();
        setQuestions(playData.questions || []);
        if (playData.topic?.course_id) {
          setCourseId(String(playData.topic.course_id));
        }
        if (playData.exercise_uuid) {
          setExerciseUuid(playData.exercise_uuid);
        }
        timeSpentPerQuestion.current = new Array(playData.questions?.length || 0).fill(0);

        if (gamificationRes.ok) {
          const gData = await gamificationRes.json();
          setGamification({ streak: gData.streak || 0, hearts: gData.hearts || 5 });
          setHearts(gData.hearts || 5);
        }
      } catch (err) {
        console.error("[TopicPlayer] Failed to load:", err);
        setError(err instanceof Error ? err.message : "Failed to load topic");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [topicId]);

  // ── Time tracking ──────────────────────────────────────────────────────────

  const recordTimeForCurrentQuestion = useCallback(() => {
    const elapsed = Math.round((Date.now() - questionStartTime.current) / 1000);
    if (timeSpentPerQuestion.current[currentIndex] !== undefined) {
      timeSpentPerQuestion.current[currentIndex] += elapsed;
    }
    questionStartTime.current = Date.now();
  }, [currentIndex]);

  // ── Score evaluation ───────────────────────────────────────────────────────

  const evaluateAnswer = useCallback(() => {
    const score = questionRef.current?.getScore() ?? null;
    if (score === null) return;

    const isCorrect = score > 0;
    const elapsed = Math.round((Date.now() - questionStartTime.current) / 1000);
    timeSpentPerQuestion.current[currentIndex] = elapsed;

    const response: QuestionResponse = {
      question_uuid: currentQuestion.uuid,
      correct: isCorrect,
      score,
      choices_selected: [],
      hints_used: hintsUsed,
      time_spent: timeSpentPerQuestion.current[currentIndex],
    };

    setQuestionResponses((prev) => [...prev, response]);

    if (!isCorrect) {
      setHearts((prev) => Math.max(0, prev - 1));
    }

    setState("feedback");
  }, [currentIndex, currentQuestion, hintsUsed]);

  // ── Navigation ─────────────────────────────────────────────────────────────

  const handleContinue = useCallback(() => {
    recordTimeForCurrentQuestion();

    if (isLastQuestion) {
      submitTelemetryRef.current?.();
    } else {
      setCurrentIndex((prev) => prev + 1);
      setState("idle");
      setShowHint(false);
      setHintsUsed(0);
    }
  }, [isLastQuestion, recordTimeForCurrentQuestion]);

  const handleSkip = useCallback(() => {
    const elapsed = Math.round((Date.now() - questionStartTime.current) / 1000);
    timeSpentPerQuestion.current[currentIndex] = elapsed;

    const response: QuestionResponse = {
      question_uuid: currentQuestion.uuid,
      correct: false,
      score: 0,
      hints_used: 0,
      time_spent: elapsed,
    };

    setQuestionResponses((prev) => [...prev, response]);

    if (isLastQuestion) {
      submitTelemetryRef.current?.();
    } else {
      setCurrentIndex((prev) => prev + 1);
      setState("idle");
      setShowHint(false);
      setHintsUsed(0);
    }
  }, [currentIndex, currentQuestion, isLastQuestion]);

  const handleShowHint = useCallback(() => {
    setShowHint(true);
    setHintsUsed((prev) => prev + 1);
  }, []);

  const handleBackToPathway = useCallback(() => {
    const target = courseId ? `/learning_pathways/${courseId}` : "/learning_pathways";
    window.location.href = target;
  }, [courseId]);

  const handleTryAgain = useCallback(() => {
    window.location.reload();
  }, []);

  const submitTelemetry = useCallback(async () => {
    const totalQuestions = questions.length;
    const correctCount = questionResponses.filter((r) => r.correct).length;
    const scorePercentage =
      totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const totalDuration = timeSpentPerQuestion.current.reduce((a, b) => a + b, 0);

    const payload = {
      exercise_uuid: exerciseUuid || "",
      topic_id: topicId,
      duration_seconds: totalDuration,
      completed_at: new Date().toISOString(),
      session_metadata: {
        source: "topic-player",
        total_questions: totalQuestions,
        correct_count: correctCount,
        score_percentage: scorePercentage,
        hearts_lost: 5 - hearts,
      },
      question_responses: questionResponses.map((r) => ({
        question_uuid: r.question_uuid,
        correct: r.correct,
        choices_selected: r.choices_selected || [],
        hints_used: r.hints_used || 0,
        time_spent: r.time_spent,
      })),
    };

    try {
      const response = await fetch("/api/assessment_sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-CSRF-Token": getCsrfToken(),
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setTelemetrySent(true);
        if (courseId) {
          try {
            await learningPathwaysApi.completeTopic(courseId, topicId);
          } catch (err) {
            console.error("[TopicPlayer] completeTopic error:", err);
          }
        }
      }
    } catch (err) {
      console.error("[TopicPlayer] Telemetry error:", err);
    } finally {
      setState("complete");
    }
  }, [questions, questionResponses, hearts, topicId, courseId, exerciseUuid]);

  // Keep submitTelemetry accessible from callbacks without adding it to their deps
  const submitTelemetryRef = useRef(submitTelemetry);
  useEffect(() => {
    submitTelemetryRef.current = submitTelemetry;
  });

  // ── Loading / Error states ─────────────────────────────────────────────────

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <Typography>Loading topic...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", flexDirection: "column", gap: 2 }}>
        <Alert severity="error">{error}</Alert>
        <Button variant="contained" onClick={handleBackToPathway}>Back to Pathway</Button>
      </Box>
    );
  }

  if (questions.length === 0 && !isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", flexDirection: "column", gap: 2 }}>
        <Alert severity="info">No questions available for this topic.</Alert>
        <Button variant="contained" onClick={handleBackToPathway}>Back to Pathway</Button>
      </Box>
    );
  }

  // ── Completion screen ──────────────────────────────────────────────────────

  if (state === "complete") {
    const correctCount = questionResponses.filter((r) => r.correct).length;
    const totalQuestions = questions.length;
    const scorePercentage =
      totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const passed = scorePercentage >= 70;

    return (
      <Box sx={{ maxWidth: 600, mx: "auto", p: 3 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: "center", borderRadius: 3 }}>
          <Zoom in timeout={600}>
            <Box>
              {passed ? (
                <EmojiEvents sx={{ fontSize: 64, color: "success.main", mb: 2 }} />
              ) : (
                <Typography variant="h1" sx={{ mb: 2 }}>📚</Typography>
              )}

              <Typography variant="h4" gutterBottom sx={{ fontWeight: "bold" }}>
                Topic Complete!
              </Typography>

              <Typography variant="h2" color={passed ? "success.main" : "warning.main"} sx={{ my: 2 }}>
                {scorePercentage}%
              </Typography>

              <Typography variant="body1" sx={{ mb: 1 }}>
                {correctCount} out of {totalQuestions} correct
              </Typography>

              <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mb: 2, flexWrap: "wrap" }}>
                <Chip
                  icon={<LocalFireDepartment />}
                  label={`${gamification.streak} day streak`}
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  icon={<Favorite />}
                  label={`${hearts} hearts remaining`}
                  color="error"
                  variant="outlined"
                />
              </Box>

              {telemetrySent && (
                <Chip label="Results saved" color="success" size="small" sx={{ mb: 2 }} />
              )}

              <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mt: 3, flexWrap: "wrap" }}>
                <Button variant="contained" onClick={handleBackToPathway}>
                  Back to Pathway
                </Button>
                <Button variant="outlined" startIcon={<Replay />} onClick={handleTryAgain}>
                  Try Again
                </Button>
              </Box>
            </Box>
          </Zoom>
        </Paper>
      </Box>
    );
  }

  // ── Main player view ───────────────────────────────────────────────────────

  const progressPercentage = Math.round(((currentIndex + 1) / questions.length) * 100);
  const isCorrect = state === "feedback" && questionRef.current?.getScore?.() > 0;
  const isIncorrect = state === "feedback" && questionRef.current?.getScore?.() === 0;
  const isMultiChoice = currentQuestion?.type === "multi-choice";

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", minHeight: "100vh", pb: 4 }}>
      {/* Header */}
      <Paper
        elevation={2}
        sx={{
          p: 2,
          mb: 2,
          position: "sticky",
          top: 0,
          zIndex: 10,
          borderRadius: 0,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Tooltip title="Back to Pathway">
              <IconButton size="small" onClick={handleBackToPathway}>
                <ArrowBack />
              </IconButton>
            </Tooltip>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {topicName}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Tooltip title={`${gamification.streak} day streak`}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.3 }}>
                <LocalFireDepartment sx={{ color: "#ff9800", fontSize: 20 }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {gamification.streak}
                </Typography>
              </Box>
            </Tooltip>
            <Tooltip title={`${hearts} hearts remaining`}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.3, color: hearts <= 1 ? "error.main" : "inherit" }}>
                <Favorite sx={{ fontSize: 20 }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {hearts}
                </Typography>
              </Box>
            </Tooltip>
            <IconButton size="small" onClick={() => setShowExitDialog(true)}>
              <Close />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <LinearProgress
            variant="determinate"
            value={progressPercentage}
            sx={{ flex: 1, height: 8, borderRadius: 4 }}
          />
          <Typography variant="body2" sx={{ minWidth: 40, textAlign: "right" }}>
            {progressPercentage}%
          </Typography>
        </Box>

        <Typography variant="caption" color="text.secondary">
          Question {currentIndex + 1} of {questions.length}
        </Typography>
      </Paper>

      {/* Exit confirmation dialog */}
      <Dialog open={showExitDialog} onClose={() => setShowExitDialog(false)}>
        <DialogTitle>Leave Topic?</DialogTitle>
        <DialogContent>
          <Typography>
            Your progress on this topic will not be saved. Are you sure you want to leave?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowExitDialog(false)}>Cancel</Button>
          <Button onClick={handleBackToPathway} color="error" variant="contained">
            Leave
          </Button>
        </DialogActions>
      </Dialog>

      {/* Feedback banner */}
      {state === "feedback" && (
        <Fade in>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 2,
              bgcolor: isCorrect ? "success.light" : isIncorrect ? "error.light" : "grey.200",
              borderRadius: 2,
              border: 1,
              borderColor: isCorrect ? "success.main" : isIncorrect ? "error.main" : "grey.300",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: isIncorrect ? 1 : 0 }}>
              {isCorrect ? (
                <>
                  <CheckCircle sx={{ color: "success.dark" }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "success.dark" }}>
                    Nice Work!
                  </Typography>
                </>
              ) : isIncorrect ? (
                <>
                  <Cancel sx={{ color: "error.dark" }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "error.dark" }}>
                    Not Quite
                  </Typography>
                </>
              ) : null}
            </Box>
            {isCorrect && (
              <Typography variant="body2">Well done! Onward!</Typography>
            )}
            {isIncorrect && (
              <Box>
                <Typography variant="body2" sx={{ color: "error.dark", mb: 0.5 }}>
                  Don't worry, let's continue!
                </Typography>
                {currentQuestion.options.find((opt) => opt.correct) && (
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Correct answer: {currentQuestion.options.find((opt) => opt.correct)?.content}
                  </Typography>
                )}
                {currentQuestion.options.find((opt) => opt.correct)?.rationale && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {currentQuestion.options.find((opt) => opt.correct)?.rationale}
                  </Typography>
                )}
              </Box>
            )}
          </Paper>
        </Fade>
      )}

      {/* Question canvas */}
      <Paper elevation={1} sx={{ p: 3, mb: 2, borderRadius: 2 }}>
        {isMultiChoice && (
          <QuestionRenderer
            question={{
              uuid: currentQuestion.uuid,
              question: currentQuestion.content,
              type: currentQuestion.type,
              choices: currentQuestion.options,
              hints: currentQuestion.hints,
              tags: [],
            }}
            reviewMode={state === "feedback"}
            numberOfHintsToShow={showHint ? hintsUsed : 0}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ref={questionRef as any}
          />
        )}
      </Paper>

      {/* Action dock */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 1,
          flexWrap: "wrap",
        }}
      >
        <Box sx={{ display: "flex", gap: 1 }}>
          {currentQuestion.hints && currentQuestion.hints.length > 0 && state !== "feedback" && (
            <Tooltip title="Show a hint">
              <span>
                <IconButton
                  onClick={handleShowHint}
                  disabled={showHint}
                  color={showHint ? "default" : "primary"}
                >
                  <Lightbulb />
                </IconButton>
              </span>
            </Tooltip>
          )}

          {state !== "feedback" && (
            <Tooltip title="Skip this question">
              <span>
                <IconButton onClick={handleSkip} disabled={state === "feedback"}>
                  <SkipNext />
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          {state === "feedback" ? (
            <Button
              variant="contained"
              size="large"
              onClick={handleContinue}
              endIcon={isLastQuestion ? <EmojiEvents /> : <SkipNext />}
            >
              {isLastQuestion ? "Finish" : "Continue"}
            </Button>
          ) : (
            <Button
              variant="contained"
              size="large"
              onClick={evaluateAnswer}
              disabled={state === "feedback"}
            >
              Check
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
}
