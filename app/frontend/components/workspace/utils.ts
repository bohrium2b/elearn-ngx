import type { QuestionNode, TagNode, WorkspaceState } from "./types";
import type { Question } from "../perseus/types";

const EMPTY_CHOICES: QuestionNode["choices"] = [];
const EMPTY_HINTS: string[] = [];

export const colorToHex = (
  c: { hex?: string } | string | undefined,
): string => {
  if (!c) return "";
  if (typeof c === "string") return c;
  return c.hex ?? "";
};

export function toPerseusQuestion(question: QuestionNode): Question {
  return {
    type: "multi-choice",
    question: question.question || "",
    choices: question.choices ?? EMPTY_CHOICES,
    hints: question.hints ?? EMPTY_HINTS,
    ...(question.code ? { questionId: question.code } : {}),
    numChoices: question.numChoices ?? 1,
  };
}

export async function fetchWorkspaceState(
  refreshPath: string,
): Promise<WorkspaceState | null> {
  const response = await fetch(refreshPath, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) return null;
  return (await response.json()) as WorkspaceState;
}

export function cloneTree(tree: TagNode[]): TagNode[] {
  return tree.map((node) => ({
    ...node,
    questions: [...node.questions],
    subtags: cloneTree(node.subtags),
  }));
}

export function flattenTags(tree: TagNode[]): TagNode[] {
  return tree.flatMap((node) => [node, ...flattenTags(node.subtags)]);
}

export function getTotalQuestionsCount(node: TagNode): number {
  return (
    node.questions.length +
    node.subtags.reduce((sum, child) => sum + getTotalQuestionsCount(child), 0)
  );
}

export function flattenQuestions(
  tree: TagNode[],
  untaggedQuestions: QuestionNode[],
): QuestionNode[] {
  const taggedQuestions = flattenTags(tree).flatMap((node) => node.questions);
  return [...untaggedQuestions, ...taggedQuestions];
}

export const UNTAGGED_TAG: TagNode = {
  id: 0,
  uuid: "__untagged__",
  slug: "untagged",
  name: "Untagged",
  color: "#9e9e9e",
  permalink: "",
  questions: [],
  subtags: [],
};

export function findSelectedTag(
  tree: TagNode[],
  selectedUuid: string | null,
): TagNode | null {
  if (!selectedUuid) return tree[0] ?? null;
  // Handle special "untagged" tag
  if (selectedUuid === "__untagged__") return UNTAGGED_TAG;
  for (const node of flattenTags(tree)) {
    if (node.uuid === selectedUuid) return node;
  }
  return tree[0] ?? null;
}

export function findSelectedQuestion(
  tree: TagNode[],
  untaggedQuestions: QuestionNode[],
  selectedQuestionId: number | null,
): QuestionNode | null {
  if (!selectedQuestionId) return null;
  return (
    flattenQuestions(tree, untaggedQuestions).find(
      (question) => question.id === selectedQuestionId,
    ) ?? null
  );
}

export function findParentTagForQuestion(
  tree: TagNode[],
  questionId: number,
): TagNode | null {
  for (const node of flattenTags(tree)) {
    if (node.questions.some((q) => q.id === questionId)) {
      return node;
    }
  }
  return null;
}

export function removeQuestionFromTree(
  tree: TagNode[],
  questionId: number,
  sourceTagId: number | null,
): TagNode[] {
  return tree.map((node) => ({
    ...node,
    questions:
      sourceTagId === null || node.id === sourceTagId
        ? node.questions.filter((question) => question.id !== questionId)
        : node.questions,
    subtags: removeQuestionFromTree(node.subtags, questionId, sourceTagId),
  }));
}

export function addQuestionToTag(
  tree: TagNode[],
  targetTagId: number,
  question: QuestionNode,
): TagNode[] {
  return tree.map((node) => ({
    ...node,
    questions:
      node.id === targetTagId &&
      !node.questions.some((item) => item.id === question.id)
        ? [...node.questions, { ...question, source_tag_id: targetTagId }]
        : node.questions,
    subtags: addQuestionToTag(node.subtags, targetTagId, question),
  }));
}

export function updateQuestionInTree(
  tree: TagNode[],
  updatedQuestion: QuestionNode,
): TagNode[] {
  return tree.map((node) => ({
    ...node,
    questions: node.questions.map((question) =>
      question.id === updatedQuestion.id
        ? { ...question, ...updatedQuestion }
        : question,
    ),
    subtags: updateQuestionInTree(node.subtags, updatedQuestion),
  }));
}
