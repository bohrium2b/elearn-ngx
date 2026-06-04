import MultiChoiceEditorMemo, { MultiChoiceEditorRef } from "../perseus/MultiChoiceEditor";
import { MultiChoiceChoice } from "../perseus/MultiChoice";
import { Typography } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@mui/material";
import { Question } from "../perseus/types";
import Input from "@mui/material/Input";
import FormLabel from "@mui/material/FormLabel"
import { toast, Toaster } from "react-hot-toast";

type ChoiceDraft = MultiChoiceChoice;

function validateQuestionDraft(questionText: string, choices: ChoiceDraft[]) {
  const normalizedQuestion = questionText.trim();

  if (normalizedQuestion.length < 10) {
    return "Question must be at least 10 characters long.";
  }

  if (choices.length < 2) {
    return "Question must include at least two choices.";
  }

  if (!choices.some((choice) => choice.correct)) {
    return "Question must have at least one correct choice.";
  }

  return null;
}

export const MultiChoiceEditor: React.FC<{
  question: Question;
  data_submit_path?: string;
  data_submit_method?: string;
  slug: string;
}> = ({ question, data_submit_path, data_submit_method, slug }) => {
  const mcqRef = useRef<MultiChoiceEditorRef>(null);
  const [currentSlug, setCurrentSlug] = useState(slug);
  const [validationError, setValidationError] = useState<string | null>(null);
  return (
    <>
      <div style={{ padding: "20px" }}>
        <FormLabel component="legend">Question Slug</FormLabel>
        <Input value={currentSlug} onChange={(e) => setCurrentSlug(e.target.value)} />
        <MultiChoiceEditorMemo ref={mcqRef} {...question} />
        <Button
          variant="contained"
          onClick={() => {
            const currentQuestion = mcqRef.current?.getQuestion() || "";
            const currentChoices = mcqRef.current?.getChoices() || [];
            const validationMessage = validateQuestionDraft(currentQuestion, currentChoices);

            if (validationMessage) {
              setValidationError(validationMessage);
              toast.error(validationMessage);
              return;
            }

            const tempQuestion = {
              question: currentQuestion,
              choices: currentChoices,
              hints: mcqRef.current?.getHints(),
              questionId: mcqRef.current?.getQuestionId(),
              numChoices: mcqRef.current?.getNumChoices(),
            } as Question;
            if (data_submit_path && data_submit_method) {
              fetch(data_submit_path, {
                method: data_submit_method,
                headers: {
                  "Content-Type": "application/json",
                  "X-CSRF-Token":
                    document
                      .querySelector('meta[name="csrf-token"]')
                      ?.getAttribute("content") || "",
                },
                body: JSON.stringify({ ...tempQuestion, slug: currentSlug }),
              })
                .then((response) => {
                  if (!response.ok) {
                    return response.json().then((json) => {
                      throw new Error(json?.message || "Network response was not ok");
                    });
                  }
                  // Attempt to parse JSON response from server
                  return response.json().catch(() => ({}));
                })
                .then((json) => {
                  setValidationError(null);
                  toast.success("Question saved successfully!");
                  if (json && json.redirected) {
                    window.location.href = json.url;
                  }
                })
                .catch((error) => {
                  const message = error instanceof Error ? error.message : "Failed to save question.";
                  setValidationError(message);
                  toast.error(message);
                });
            } else {
              toast.error("Data submit path or method not provided.");
            }
          }}
        >
          Save
        </Button>
        {validationError ? (
          <Typography color="error" sx={{ marginTop: 1 }}>
            {validationError}
          </Typography>
        ) : null}
      </div>
      <Toaster position="bottom-left" />
    </>
  );
};

export const tagName = "multi-choice-editor";
export default MultiChoiceEditor;
