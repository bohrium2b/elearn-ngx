import type { MultiChoiceChoice } from "./MultiChoice";

export type MultiChoiceQuestion = {
  question: string;
  choices: MultiChoiceChoice[];
  hints?: string[];
  questionId?: string;
  numChoices?: number;
};

export type PassageQuestion = MultiChoiceQuestion & {
  passage: string;
};

export type Question =
  | (MultiChoiceQuestion & { type: "multi-choice" })
  | (PassageQuestion & { type: "passage" });

export type ExamData = {
  questions: Question[];
  instructions: string;
};
