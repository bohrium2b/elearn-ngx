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
}

export default function InteractivePlayer({
  exerciseId,
  title
}: InteractivePlayerProps) {
  const [questions, setQuestions] = React.useState<ResolvedQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [questionResults, setQuestionResults] = React.useState<QuestionResult[]>([]);
  const theme = useTheme();
  // Array of refs - one per question
  const questionRefs = React.useRef<(MultiChoiceRef | null)[]>([]);

  React.useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await fetch(`/exercises/${exerciseId}/start`, {
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
          }
        });
        const data = await response.json();
        setQuestions(data.questions || []);
      } catch (error) {
        console.error("Failed to load exercise:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuestions();
  }, [exerciseId]);

  const handleSubmitAll = () => {
    // Capture scores from all questions
    const results: QuestionResult[] = questions.map((question, idx) => {
      const ref = questionRefs.current[idx];
      const score = ref?.getScore() ?? null;

      console.log(`[InteractivePlayer] Question ${idx + 1} - Score: ${score}`);

      return {
        questionUuid: question.uuid,
        correct: (score ?? 0) > 0,
        score: score ?? 0
      };
    });

    console.log("[InteractivePlayer] All results:", results);
    setQuestionResults(results);
    setIsSubmitted(true);
  };

  const handleRestart = () => {
    setQuestionResults([]);
    setIsSubmitted(false);
    setCurrentIndex(0);
    // Reset all question refs
    questionRefs.current.forEach(ref => {
      if (ref) {
        ref.setSerializedState(null);
      }
    });
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <Typography>Loading exercise...</Typography>
      </Box>
    );
  }

  if (questions.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <Typography>No questions available for this exercise.</Typography>
      </Box>
    );
  }

  // Calculate score for display
  const correctCount = questionResults.filter(r => r.correct).length;
  const percentage = questionResults.length > 0
    ? Math.round((correctCount / questions.length) * 100)
    : 0;

  // Before submission: show one question at a time
  // After submission: show all questions with review mode
  const showAllQuestions = isSubmitted;

  return (
    <Box sx={{ maxWidth: "60%", margin: "auto", p: 2 }}>
      <Typography variant="h5" gutterBottom>{title}</Typography>

      {!isSubmitted && (
        <>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="h6">Question {currentIndex + 1} of {questions.length}</Typography>
            <Typography variant="h6">Progress: {Math.round(((currentIndex + 1) / questions.length) * 100)}%</Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={((currentIndex + 1) / questions.length) * 100}
            sx={{ mb: 3 }}
          />
        </>
      )}

      {isSubmitted && (
        <Box sx={{
          textAlign: 'center',
          py: 3,
          bgcolor: 'action.hover',
          borderRadius: 2,
          mb: 4
        }}>
          <Typography variant="h4" gutterBottom>Exercise Complete!</Typography>
          <Typography variant="h2" color={percentage >= 70 ? 'success.main' : 'error.main'}>
            {percentage}%
          </Typography>
          <Typography variant="h6">
            {correctCount} out of {questions.length} correct
          </Typography>
        </Box>
      )}

      {/* Render questions - one at a time before submit, all after submit */}
      {questions.map((question, idx) => {
        // Before submission: only show current question
        // After submission: show all questions
        const isVisible = showAllQuestions || idx === currentIndex;

        const result = questionResults.find(r => r.questionUuid === question.uuid);

        return (
          <Box
            key={question.uuid}
            sx={{
              display: isVisible ? 'block' : 'none',
              mb: 4,
              p: 2,
              border: "1px solid #eee",
              borderRadius: 2,
              position: 'relative',
              // Disable pointer events after submission so users can't change answers
              pointerEvents: isSubmitted ? 'none' : 'auto',
              opacity: isSubmitted ? 0.9 : 1,
              backgroundColor: theme.palette.background.paper
            }}
          >
            {/* Question header with number and result chip */}
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2
            }}>
              <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                Question {idx + 1}
              </Typography>
              {isSubmitted && result && (
                <Chip
                  label={result.correct ? 'Correct' : 'Incorrect'}
                  color={result.correct ? 'success' : 'error'}
                  sx={{
                    color: 'white'
                  }}
                  size="small"
                />
              )}
            </Box>

            {/* Question content with Perseus Review mode when submitted */}
            <MultiChoice
              ref={(el) => { questionRefs.current[idx] = el; }}
              question={question.content}
              choices={question.options}
              hints={question.hints || []}
              reviewMode={isSubmitted}
            />
          </Box>
        );
      })}

      <Box sx={{ display: "flex", gap: 2, justifyContent: 'center', mt: 3 }}>
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
              <Button variant="contained" onClick={handleSubmitAll} size="large">
                Submit All Answers
              </Button>
            )}
          </>
        ) : (
          <>
            <Button variant="outlined" onClick={() => window.location.href = '/exercises'}>
              Back to Exercises
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
