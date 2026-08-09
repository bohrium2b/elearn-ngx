export interface Choice {
  content: string;
  correct: boolean;
  id?: string | undefined;
  rationale?: string | undefined;
}

export interface Question {
  id: number;
  uuid: string;
  slug: string;
  label: string;
  question: string;
  choices: Choice[];
  hints: string[];
  numChoices: number;
  showPath: string;
  updatePath: string;
  source_tag_id?: number | null;
  code?: string | null;
  type?: string;
}

export interface Tag {
  id: number;
  uuid: string;
  slug: string;
  name: string;
  color: string;
  permalink: string;
}

export interface TreeNode<TN> {
  id: number;
  uuid: string;
  questions: Question[];
  children: TN[];
}

export interface TagNode extends Tag, TreeNode<TagNode> {}
