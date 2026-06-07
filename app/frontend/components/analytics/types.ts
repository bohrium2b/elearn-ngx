// ── Analytics Type Definitions ────────────────────────────────────────────────

export interface DashboardSummary {
  total_sessions: number;
  average_score: number;
  recent_sessions_count: number;
  recent_average_score: number;
  weekly_sessions_count: number;
  weekly_average_score: number;
  total_questions_answered: number;
  total_correct: number;
  current_streak: number;
}

export interface LedgerEntry {
  id: number;
  uuid: string | null;
  exercise_id: number;
  exercise_title: string;
  score_percentage: number;
  total_questions: number;
  correct_count: number;
  duration_seconds: number;
  completed_at: string;
  review_path: string;
}

export interface WeakPoint {
  question_uuid: string;
  attempts: number;
  correct: number;
  success_rate: number;
  last_attempt: string;
  tags: string[];
}

export interface Recommendation {
  type?: string;
  question_uuid?: string;
  slug?: string;
  tags: { name: string; uuid: string }[];
  config_preview?: string | null;
  title?: string;
  description?: string;
  exercise_path?: string;
  tag_uuids?: string[];
  question_uuids?: string[];
}

export interface DashboardData {
  summary: DashboardSummary;
  ledger: LedgerEntry[];
  weak_points: WeakPoint[];
  recommendations: Recommendation[];
}

export interface QuestionResponse {
  question_uuid: string;
  correct: boolean;
  choices_selected: number[] | null | undefined;
  hints_used: number | null | undefined;
  retry_count: number | null | undefined;
  time_spent: number | null | undefined;
  question_text: string | null | undefined;
  choices: ChoiceData[] | null | undefined;
  correct_answer: string | null | undefined;
  rationale: string | null | undefined;
}

export interface ChoiceData {
  content: string;
  correct: boolean;
  rationale: string | null | undefined;
}

export interface TagRegistryEntry {
  name: string;
  slug: string;
  uuid: string;
  parent_id: number | null;
  ancestor_path: { name: string; uuid: string }[];
}

export interface SessionReviewData {
  session: {
    id: number;
    uuid: string | null;
    exercise_title: string;
    score_percentage: number;
    duration_seconds: number;
    completed_at: string;
    question_responses: QuestionResponse[];
    tag_registry: Record<string, TagRegistryEntry>;
  };
}

export interface CohortMetrics {
  total_sessions: number;
  unique_students: number;
  average_score: number;
  median_score: number;
  average_duration_seconds: number;
  grade_distribution: Record<string, number>;
  completion_trend: Record<string, number>;
}

export interface TagMatrixNode {
  uuid: string;
  name: string;
  slug: string;
  color: string;
  average_score: number;
  total_responses: number;
  children: TagMatrixNode[];
}

export interface ItemDiscrimination {
  question_uuid: string;
  total_attempts: number;
  correct_count: number;
  failure_rate: number;
  flagged: boolean;
}
