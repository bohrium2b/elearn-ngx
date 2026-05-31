import { QuestionRendererWithUI } from "../perseus/QuestionRenderer";
import type { MultiChoiceQuestion } from "../perseus/types";
import React, { useEffect, useRef, useState } from "react";

type QuestionRendererIsland = {
  question: MultiChoiceQuestion & { type: "multi-choice" };
};

export const QuestionRendererIsland: React.FC<QuestionRendererIsland> = ({
  question,
}) => {
  console.log("Rendering QuestionRendererIsland with question:", question);
  return (
    <div>
      <QuestionRendererWithUI question={question} />
    </div>
  );
};

export const tagName = "question-renderer";
export default QuestionRendererIsland;
