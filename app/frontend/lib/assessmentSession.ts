import { getCsrfToken } from "./getCsrfToken";

export interface QuestionResult {
  questionUuid: string;
  correct: boolean;
  score: number;
  choicesSelected?: number[];
  hintsUsed?: number;
  timeSpent?: number;
}

export interface AssessmentSessionPayload {
  exerciseUuid: string;
  topicId?: string;
  durationSeconds: number;
  completedAt: string;
  sessionMetadata: Record<string, unknown>;
  questionResponses: QuestionResult[];
}

export async function submitAssessmentSession(
  payload: AssessmentSessionPayload
): Promise<boolean> {
  const response = await fetch("/api/assessment_sessions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-CSRF-Token": getCsrfToken(),
    },
    body: JSON.stringify({
      exercise_uuid: payload.exerciseUuid,
      topic_id: payload.topicId,
      duration_seconds: payload.durationSeconds,
      completed_at: payload.completedAt,
      session_metadata: payload.sessionMetadata,
      question_responses: payload.questionResponses.map((r) => ({
        question_uuid: r.questionUuid,
        correct: r.correct,
        choices_selected: r.choicesSelected || [],
        hints_used: r.hintsUsed || 0,
        time_spent: r.timeSpent || 0,
      })),
    }),
  });

  if (!response.ok) {
    console.error("[AssessmentSession] Submission failed:", response.status);
    return false;
  }

  return true;
}
