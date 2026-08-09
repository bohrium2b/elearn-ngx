import type { Question } from './types';

export interface TreeNode<TN = Question> {
  id: number;
  uuid: string;
  questions: Question[];
  children: TN[];
}

export function flattenTags<T extends TreeNode<T>>(tree: T[]): T[] {
  return tree.flatMap((node) => [node, ...flattenTags(node.children)]);
}

export function getTotalQuestionsCount<T extends TreeNode<T>>(node: T): number {
  return (
    node.questions.length +
    node.children.reduce((sum, child) => sum + getTotalQuestionsCount(child), 0)
  );
}

export function findInTree<T extends TreeNode<T>>(
  tree: T[],
  predicate: (node: T) => boolean,
): T | null {
  for (const node of tree) {
    if (predicate(node)) return node;
    const found = findInTree(node.children, predicate);
    if (found) return found;
  }
  return null;
}

export function flattenQuestions<T extends TreeNode<T>>(tree: T[]): Question[] {
  return flattenTags(tree).flatMap((node) => node.questions);
}
