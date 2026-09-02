import { PASSING_THRESHOLD } from "./constants";

export function calculateScorePercentage(correctCount: number, totalQuestions: number): number {
  if (totalQuestions <= 0) return 0;
  return Math.round((correctCount / totalQuestions) * 100);
}

export function isPassing(scorePercentage: number): boolean {
  return scorePercentage >= PASSING_THRESHOLD;
}
