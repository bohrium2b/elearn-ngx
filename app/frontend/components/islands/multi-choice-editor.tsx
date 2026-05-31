import MultiChoiceEditorMemo from "../perseus/MultiChoiceEditor";
import { MultiChoiceRef } from "../perseus/MultiChoice";
import { Typography } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@mui/material";
import { Question } from "../perseus/types";
import { toast, Toaster } from "react-hot-toast";

export const MultiChoiceEditor: React.FC<{
  question: Question;
  data_submit_path?: string;
  data_submit_method?: string;
}> = ({ question, data_submit_path, data_submit_method }) => {
  const mcqRef = useRef<MultiChoiceRef>(null);

  return (
    <>
      <div style={{ padding: "20px" }}>
        <MultiChoiceEditorMemo ref={mcqRef} {...question} />
        <Button
          variant="contained"
          onClick={() => {
            const tempQuestion = {
              question: mcqRef.current?.getQuestion(),
              choices: mcqRef.current?.getChoices(),
              hints: mcqRef.current?.getHints(),
              questionId: mcqRef.current?.getQuestionId(),
              numChoices: mcqRef.current?.getNumChoices(),
            } as Question;
            console.log("Submitting Question Data:");
            console.log("Current Question State:", tempQuestion);
            // Now send tempQuestion to the server or handle it as needed
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
                body: JSON.stringify(tempQuestion),
              })
                .then((response) => {
                  if (!response.ok) {
                    throw new Error("Network response was not ok");
                  }
                  // Attempt to parse JSON response from server
                  return response.json().catch(() => ({}));
                })
                .then((json) => {
                  console.log("Success JSON:", json);
                  toast.success("Question saved successfully!");
                  if (json && json.redirected) {
                    window.location.href = json.url;
                  }
                })
                .catch((error) => {
                  console.error("Error:", error);
                  // Optionally, show an error message to the user
                  toast.error("Failed to save question.");
                });
            } else {
              console.warn(
                "Data submit path or method not provided. Question data:",
                tempQuestion,
              );
            }
          }}
        >
          Save
        </Button>
      </div>
      <Toaster position="bottom-left" />
    </>
  );
};

export const tagName = "multi-choice-editor";
export default MultiChoiceEditor;
