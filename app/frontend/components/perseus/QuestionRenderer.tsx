import type { Question } from "./types";
import React, { useState, useEffect, useRef } from "react";
import { MultiChoice, type MultiChoiceRef } from "./MultiChoice";
import { Box, Paper, Button, Typography, Popover } from "@mui/material";
import CorrectIcon from "./assets/CorrectIcon.svg?react";
import IncorrectIcon from "./assets/IncorrectIcon.svg?react";
import theme from "./theme";

export const QuestionRenderer: React.ForwardRefExoticComponent<{
  question: Question;
  reviewMode?: boolean;
  numberOfHintsToShow?: number;
}> = React.forwardRef(({ question, reviewMode, numberOfHintsToShow }, ref) => {
  // Forward ref from MCQ component to full renderer, to allow parent components to access MultiChoice methods (e.g., getScore)
  const mcqRef = useRef<MultiChoiceRef>(null);
  const getScore = React.useCallback(() => {
    return mcqRef.current?.getScore() ?? null;
  }, []);

  React.useImperativeHandle(ref, () => ({
    getScore: getScore,
  }));

  switch (question.type) {
    case "multi-choice":
      return (
        <MultiChoice
          ref={mcqRef}
          {...question}
          reviewMode={reviewMode}
          showHintsUI={false}
          numberOfHintsToShow={numberOfHintsToShow}
        />
      );
    default:
      return null;
  }
});

export const QuestionRendererWithUI: React.FC<{ question: Question }> = ({
  question,
}) => {
  console.log("Rendering Question:", question);
  const hintsAvailable = question.hints && question.hints.length > 0;
  const [hintsToShow, setHintsToShow] = useState(0);
  const [score, setScore] = useState<number | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const questionRef = useRef<any>(null);
  const [reviewMode, setReviewMode] = useState(false);
  // Generate random ID
  const [randomId, _] = useState(Math.random().toString(36).substring(2, 15));

  useEffect(() => {
    if (score !== null) {
      setAnchorEl(document.getElementById("check-score-button-" + randomId));
    }
  }, [score]);

  const handleClose = () => {
    setAnchorEl(null);
  };

  const checkScore = () => {
    // Access the getScore method from the QuestionRenderer
    const currentScore = questionRef.current?.getScore();
    console.log(currentScore);
    setScore(currentScore);
    if (currentScore >= 0) {
      setReviewMode(true);
    }
    if (currentScore === 0) {
      // Show all hints
      setHintsToShow(question.hints ? question.hints.length : 0);
    }
  };
  return (
    <Paper elevation={3} sx={{ padding: 2, margin: 2 }}>
      <Box sx={{ pointerEvents: reviewMode ? "none" : "auto" }}>
        <QuestionRenderer
          question={question}
          reviewMode={reviewMode}
          numberOfHintsToShow={hintsToShow}
          // @ts-expect-error - TS2769 - No overload matches this call.
          ref={questionRef}
        />
      </Box>
      <Box
        sx={{
          marginTop: 2,
          paddingTop: 1,
          borderTop: `2.5px dashed ${theme.palette.grey[300]}`,
        }}
      >
        {/* On left, button for hint (if available) */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Button
            variant="text"
            size="small"
            disabled={
              !hintsAvailable ||
              hintsToShow >= (question.hints?.length || 0) ||
              reviewMode
            }
            onClick={() => {
              setHintsToShow((prev) => prev + 1);
            }}
          >
            {hintsToShow >= (question.hints?.length || 0)
              ? "No more hints available"
              : "Stuck? Get a hint"}
          </Button>
          {/* On right, display Scoring */}
          <Button
            variant="contained"
            size="large"
            onClick={checkScore}
            disabled={reviewMode}
            id={"check-score-button-" + randomId}
          >
            Check
          </Button>
          <Popover
            open={Boolean(anchorEl)}
            anchorEl={anchorEl}
            onClose={handleClose}
            anchorOrigin={{
              vertical: "top",
              horizontal: "center",
            }}
            transformOrigin={{
              vertical: "bottom",
              horizontal: "left",
            }}
          >
            <Box sx={{ padding: 2 }}>
              <ScoreTooltip score={score} />
            </Box>
          </Popover>
        </Box>
      </Box>
    </Paper>
  );
};

const ScoreTooltip: React.FC<{ score: number | null }> = ({ score }) => {
  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.paper,
      }}
    >
      {score === 1 ? (
        <>
          <Box sx={{ display: "flex", alignItems: "center", marginBottom: 1 }}>
            <CorrectIcon style={{ width: 24, height: 24, marginRight: 8 }} />
            <Typography variant="body1" color="success.main">
              Nice Work!
            </Typography>
          </Box>
          <Typography variant="body1">Well done! Onward!</Typography>
        </>
      ) : score === 0 ? (
        <>
          <Box sx={{ display: "flex", alignItems: "center", marginBottom: 1 }}>
            <IncorrectIcon style={{ width: 24, height: 24, marginRight: 8 }} />
            <Typography variant="body1" color="error.main">
              Not Quite
            </Typography>
          </Box>
          <Typography variant="body1">Don't worry, let's continue!</Typography>
        </>
      ) : (
        <Typography variant="body1">
          We couldn't grade your answer. Make sure you have fully completed the
          question, then try again.
        </Typography>
      )}
    </Box>
  );
};
