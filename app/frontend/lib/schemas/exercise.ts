import { z } from "zod";

export const ResolvedQuestionSchema = z.object({
  uuid: z.string(),
  content: z.string(),
  options: z.array(
    z.object({
      content: z.string(),
      correct: z.boolean(),
      id: z.string().optional(),
      rationale: z.string().optional(),
    }),
  ),
  hints: z.array(z.string()).default([]),
  numChoices: z.number().default(1),
  type: z.string().default("multi-choice"),
});

export const ExerciseStartResponseSchema = z.object({
  title: z.string(),
  questions: z.array(ResolvedQuestionSchema),
});

const _TagTreeQuestionSchema = z.object({
  id: z.number(),
  uuid: z.string(),
  slug: z.string(),
  code: z.string().nullable().default(null),
  label: z.string(),
  question: z.string(),
  choices: z.array(
    z.object({
      content: z.string(),
      correct: z.boolean(),
      id: z.string().optional(),
      rationale: z.string().optional(),
    }),
  ),
  hints: z.array(z.string()).default([]),
  numChoices: z.number(),
  showPath: z.string(),
  updatePath: z.string(),
  type: z.string(),
});

export const TagTreeQuestionSchema = _TagTreeQuestionSchema;

function makeTagTreeNodeSchema(): z.ZodType<{
  id: number;
  uuid: string;
  slug: string;
  name: string;
  color: string;
  permalink: string;
  type: string;
  questions: z.infer<typeof _TagTreeQuestionSchema>[];
  children: z.infer<typeof _TagTreeNodeSchema>[];
}> {
  return z.object({
    id: z.number(),
    uuid: z.string(),
    slug: z.string(),
    name: z.string(),
    color: z.string(),
    permalink: z.string(),
    type: z.string(),
    questions: z.array(_TagTreeQuestionSchema).default([]),
    children: z.array(z.lazy(() => _TagTreeNodeSchema)).default([]),
  });
}

const _TagTreeNodeSchema = makeTagTreeNodeSchema();
export const TagTreeNodeSchema = _TagTreeNodeSchema;
