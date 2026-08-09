import { z } from "zod";

export const DashboardSummarySchema = z.object({
  total_sessions: z.number(),
  average_score: z.number(),
  recent_sessions_count: z.number(),
  recent_average_score: z.number(),
  weekly_sessions_count: z.number(),
  weekly_average_score: z.number(),
  total_questions_answered: z.number(),
  total_correct: z.number(),
  current_streak: z.number(),
});

export const LedgerEntrySchema = z.object({
  id: z.number(),
  uuid: z.string().nullable().default(null),
  exercise_id: z.number(),
  exercise_title: z.string(),
  score_percentage: z.number(),
  total_questions: z.number(),
  correct_count: z.number(),
  duration_seconds: z.number(),
  completed_at: z.string(),
  review_path: z.string(),
});

export const WeakPointSchema = z.object({
  question_uuid: z.string(),
  attempts: z.number(),
  correct: z.number(),
  success_rate: z.number(),
  last_attempt: z.string(),
  tags: z.array(z.string()).default([]),
});

export const RecommendationSchema = z.object({
  type: z.string().default(""),
  question_uuid: z.string().default(""),
  slug: z.string().default(""),
  tags: z.array(
    z.object({
      name: z.string(),
      uuid: z.string(),
    }),
  ).default([]),
  config_preview: z.string().nullable().default(null),
  title: z.string().default(""),
  description: z.string().default(""),
  exercise_path: z.string().default(""),
  tag_uuids: z.array(z.string()).default([]),
  question_uuids: z.array(z.string()).default([]),
});

export const DashboardDataSchema = z.object({
  summary: DashboardSummarySchema,
  ledger: z.array(LedgerEntrySchema).default([]),
  weak_points: z.array(WeakPointSchema).default([]),
  recommendations: z.array(RecommendationSchema).default([]),
});

export const ChoiceDataSchema = z.object({
  content: z.string(),
  correct: z.boolean(),
  rationale: z.string().nullable().default(null),
});

export const QuestionResponseSchema = z.object({
  question_uuid: z.string(),
  correct: z.boolean(),
  choices_selected: z.array(z.number()).nullable().default(null),
  hints_used: z.number().nullable().default(null),
  retry_count: z.number().nullable().default(null),
  time_spent: z.number().nullable().default(null),
  question_text: z.string().nullable().default(null),
  choices: z.array(ChoiceDataSchema).nullable().default(null),
  correct_answer: z.string().nullable().default(null),
  rationale: z.string().nullable().default(null),
});

export const TagRegistryEntrySchema = z.object({
  name: z.string(),
  slug: z.string(),
  uuid: z.string(),
  parent_id: z.number().nullable().default(null),
  ancestor_path: z.array(
    z.object({
      name: z.string(),
      uuid: z.string(),
    }),
  ).default([]),
});

export const SessionReviewDataSchema = z.object({
  session: z.object({
    id: z.number(),
    uuid: z.string().nullable().default(null),
    exercise_title: z.string(),
    score_percentage: z.number(),
    duration_seconds: z.number(),
    completed_at: z.string(),
    question_responses: z.array(QuestionResponseSchema).default([]),
    tag_registry: z.record(z.string(), TagRegistryEntrySchema).default({}),
  }),
});

export const CohortMetricsSchema = z.object({
  total_sessions: z.number(),
  unique_students: z.number(),
  average_score: z.number(),
  median_score: z.number(),
  average_duration_seconds: z.number(),
  grade_distribution: z.record(z.string(), z.number()).default({}),
  completion_trend: z.record(z.string(), z.number()).default({}),
});

function makeTagMatrixNodeSchema(): z.ZodType<{
  uuid: string;
  name: string;
  slug: string;
  color: string;
  average_score: number;
  total_responses: number;
  children: z.infer<typeof _TagMatrixNodeSchema>[];
}> {
  return z.object({
    uuid: z.string(),
    name: z.string(),
    slug: z.string(),
    color: z.string(),
    average_score: z.number(),
    total_responses: z.number(),
    children: z.array(z.lazy(() => _TagMatrixNodeSchema)).default([]),
  });
}

const _TagMatrixNodeSchema = makeTagMatrixNodeSchema();
export const TagMatrixNodeSchema = _TagMatrixNodeSchema;

export const ItemDiscriminationSchema = z.object({
  question_uuid: z.string(),
  total_attempts: z.number(),
  correct_count: z.number(),
  failure_rate: z.number(),
  flagged: z.boolean(),
});
