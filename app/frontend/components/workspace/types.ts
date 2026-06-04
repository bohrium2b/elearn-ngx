export type QuestionNode = {
  id: number;
  uuid: string;
  slug: string;
  code?: string | null;
  label: string;
  question: string;
  choices: Array<{ content: string; correct: boolean; rationale?: string }>;
  hints: string[];
  numChoices: number;
  showPath: string;
  updatePath: string;
  source_tag_id?: number | null;
};

export type TagNode = {
  id: number;
  uuid: string;
  slug: string;
  name: string;
  color: string;
  permalink: string;
  questions: QuestionNode[];
  subtags: TagNode[];
};

export type WorkspaceProps = {
  treeData: TagNode[];
  untaggedQuestions: QuestionNode[];
  refreshPath: string;
  classifyPath: string;
  csrfToken: string;
};

export type DragPayload = {
  questionId: number;
  sourceTagId: number | null;
};

export type WorkspaceState = {
  treeData: TagNode[];
  untaggedQuestions: QuestionNode[];
};
