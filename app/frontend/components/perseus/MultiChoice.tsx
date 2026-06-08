/* eslint-disable @typescript-eslint/no-explicit-any */
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
  id?: string | undefined;
  rationale?: string | undefined;
};

export type MultiChoiceRef = {
  getScore: () => number | null;
  getSelectedChoices: () => number[];
  getHintsUsed: () => number;
  getSerializedState: () => any;
  setSerializedState: (state: any) => void;
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
    const rendererRef = React.useRef<any>(null);
    const hintsUsedRef = React.useRef(0);

    // Expose methods to parent component
    React.useImperativeHandle(ref, () => ({
      getScore: () => rendererRef.current?.getScore() ?? null,
      getSelectedChoices: () => {
        const renderer = rendererRef.current;
        if (!renderer) return [];
        
        // Get user input from the renderer using serialized state
        const serializedState = renderer.getSerializedState?.();
        if (!serializedState?.question) return [];

        // Extract selected choice indices from the radio widget state
        const selectedIndices: number[] = [];
        
        // The serialized state contains widget IDs mapped to their state
        // For radio widgets, we need to find which choices are selected
        Object.keys(serializedState.question).forEach((widgetId) => {
          const widgetState = serializedState.question[widgetId];
          if (widgetState && typeof widgetState === 'object') {
            // Check for selected choices in the widget state
            // The structure depends on the Perseus radio widget
            const selectedIds = widgetState.selectedChoiceIds || widgetState.choices?.filter((c: any) => c.selected).map((c: any) => c.id) || [];
            
            if (Array.isArray(selectedIds)) {
              selectedIds.forEach((id: string) => {
                const index = choices.findIndex(
                  (choice, idx) => choice.id === id || `radio-choice-${idx + 1}` === id
                );
                if (index !== -1 && !selectedIndices.includes(index)) {
                  selectedIndices.push(index);
                }
              });
            }
          }
        });

        return selectedIndices;
      },
      getHintsUsed: () => hintsUsedRef.current,
      getSerializedState: () => rendererRef.current?.getSerializedState(),
      setSerializedState: (state: any) => rendererRef.current?.setSerializedState(state),
    }));

    // Template for perseus item
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
                rationale: choice.rationale ?? "",
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

    // Track hints used via PerseusRenderer's hintsIndex
    const handleScoreChange = React.useCallback((score: number) => {
      // Update hints used count based on renderer state
      if (rendererRef.current) {
        const hintsIndex = rendererRef.current.getHintsIndex?.() ?? -1;
        if (hintsIndex >= 0) {
          hintsUsedRef.current = hintsIndex + 1;
        }
      }
      onScoreChange?.(score);
    }, [onScoreChange]);

    return (
      <>
        <PerseusRenderer
          ref={rendererRef}
          question={question}
          item={item}
          hints={hints}
          questionId={questionId ?? ""}
          onScoreChange={handleScoreChange}
          reviewMode={reviewMode}
          showHintsUI={showHintsUI}
          numberOfHintsToShow={numberOfHintsToShow ?? 0}
        />
      </>
    );
  },
);
