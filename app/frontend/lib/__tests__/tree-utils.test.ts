import { describe, it, expect } from "vitest";
import {
  flattenTags,
  getTotalQuestionsCount,
  findInTree,
  flattenQuestions,
} from "@/lib/tree-utils";
import type { Question, TreeNode } from "@/lib/types";

const makeQuestion = (id: number, slug: string): Question => ({
  id,
  uuid: `q-${id}`,
  slug,
  label: `Question ${id}`,
  question: `Question text ${id}`,
  choices: [{ content: "A", correct: true }],
  hints: [],
  numChoices: 1,
  showPath: `/questions/${id}`,
  updatePath: `/questions/${id}`,
});

const makeNode = (
  id: number,
  slug: string,
  questions: Question[],
  children: TreeNode<Question>[] = [],
): TreeNode<Question> => ({
  id,
  uuid: `tag-${id}`,
  name: `Tag ${id}`,
  color: "#000000",
  permalink: `/tags/${id}`,
  questions,
  children,
});

describe("flattenTags", () => {
  it("returns a single root node", () => {
    const tree = [makeNode(1, "a", [makeQuestion(1, "q1")])];
    expect(flattenTags(tree)).toHaveLength(1);
  });

  it("flattens nested children in depth-first order", () => {
    const tree = [
      makeNode(1, "a", [], [
        makeNode(2, "b", [makeQuestion(1, "q1")]),
        makeNode(3, "c", [makeQuestion(2, "q2")]),
      ]),
    ];
    const result = flattenTags(tree);
    expect(result.map((n) => n.id)).toEqual([1, 2, 3]);
  });

  it("returns empty array for empty input", () => {
    expect(flattenTags([])).toEqual([]);
  });
});

describe("getTotalQuestionsCount", () => {
  it("counts only root questions when no children", () => {
    const node = makeNode(1, "a", [makeQuestion(1, "q1"), makeQuestion(2, "q2")]);
    expect(getTotalQuestionsCount(node)).toBe(2);
  });

  it("counts questions across nested children", () => {
    const node = makeNode(1, "a", [makeQuestion(1, "q1")], [
      makeNode(2, "b", [makeQuestion(2, "q2"), makeQuestion(3, "q3")]),
      makeNode(3, "c", [makeQuestion(4, "q4")]),
    ]);
    expect(getTotalQuestionsCount(node)).toBe(4);
  });

  it("returns 0 for node with no questions and no children", () => {
    expect(getTotalQuestionsCount(makeNode(1, "a", []))).toBe(0);
  });
});

describe("findInTree", () => {
  const tree = [
    makeNode(1, "a", [], [
      makeNode(2, "b", [makeQuestion(1, "q1")]),
      makeNode(3, "c", [makeQuestion(2, "q2")]),
    ]),
  ];

  it("finds root node matching predicate", () => {
    const found = findInTree(tree, (n) => n.id === 1);
    expect(found?.id).toBe(1);
  });

  it("finds nested child node matching predicate", () => {
    const found = findInTree(tree, (n) => n.id === 3);
    expect(found?.id).toBe(3);
  });

  it("returns null when no node matches", () => {
    const found = findInTree(tree, (n) => n.id === 99);
    expect(found).toBeNull();
  });
});

describe("flattenQuestions", () => {
  it("collects questions from all nodes including nested children", () => {
    const tree = [
      makeNode(1, "a", [makeQuestion(1, "q1")], [
        makeNode(2, "b", [makeQuestion(2, "q2")]),
      ]),
    ];
    const result = flattenQuestions(tree);
    expect(result.map((q) => q.id)).toEqual([1, 2]);
  });

  it("returns empty array for empty tree", () => {
    expect(flattenQuestions([])).toEqual([]);
  });
});

