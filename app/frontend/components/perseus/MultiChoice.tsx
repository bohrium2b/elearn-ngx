import type { PerseusItem } from "@khanacademy/perseus-core";
import { PerseusRenderer } from "./PerseusRenderer";
import type { MultiChoiceQuestion } from "./types";
import React from "react";

export type MultiChoiceProps = MultiChoiceQuestion & {
  onScoreChange?: (score: number) => void;
  reviewMode?: boolean;
  showHintsUI?: boolean;
  numberOfHintsToShow?: number;
};

export type MultiChoiceChoice = {
  content: string;
  correct: boolean;
  id?: string;
  rationale?: string;
};

export type MultiChoiceRef = {
  getScore: () => number | null;
};

export const MultiChoice = React.forwardRef<MultiChoiceRef, MultiChoiceProps>(
  (
    {
      question,
      choices,
      hints = [],
      questionId,
      numChoices,
      onScoreChange,
      reviewMode = false,
      showHintsUI = true,
      numberOfHintsToShow,
    }: MultiChoiceProps,
    ref,
  ) => {
    /* This component renders a multiple-choice question using the PerseusRenderer.
     * It accepts a question string, an array of choices, optional hints, a question ID,
     * and a callback function to handle score changes.
     * The component uses the PerseusRenderer to render the question and choices.
     */
    const rendererRef = React.useRef<any>(null);

    // Expose the getScore method to the parent component
    React.useImperativeHandle(ref, () => ({
      getScore: getScore,
    }));

    const getScore = React.useCallback(() => {
      return rendererRef.current?.getScore() ?? null;
    }, []);
    // Template for perseusitem
    const item: PerseusItem = {
      question: {
        content: "[[☃ radio 1]]",
        images: {},
        widgets: {
          "radio 1": {
            type: "radio",
            options: {
              choices: choices.map((choice, index) => ({
                content: choice.content,
                correct: choice.correct,
                id: choice.id ?? "radio-choice-" + (index + 1).toString(),
                rationale: choice.rationale,
              })),
              randomize: true,
              multipleSelect: (numChoices ?? 1) > 1,
            },
          },
        },
      },
      hints: [],
      answerArea: {
        calculator: false,
        financialCalculatorMonthlyPayment: false,
        financialCalculatorTotalAmount: false,
        financialCalculatorTimeToPayOff: false,
        periodicTable: false,
        periodicTableWithKey: false,
      },
    };
    // Render a perseusrenderer for abstraction
    return (
      <>
        <PerseusRenderer
          ref={rendererRef}
          question={question}
          item={item}
          hints={hints}
          questionId={questionId}
          onScoreChange={onScoreChange}
          reviewMode={reviewMode}
          showHintsUI={showHintsUI}
          numberOfHintsToShow={numberOfHintsToShow}
        />
      </>
    );
  },
);
