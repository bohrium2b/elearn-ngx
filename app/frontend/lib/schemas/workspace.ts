import { z } from "zod";
import type { QuestionNode, TagNode } from "@/components/workspace/types";

export const QuestionNodeSchema: z.ZodType<QuestionNode> = z.object({
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
      rationale: z.string().optional(),
    }),
  ),
  hints: z.array(z.string()).default([]),
  numChoices: z.number(),
  showPath: z.string(),
  updatePath: z.string(),
  source_tag_id: z.number().nullable().default(null),
});

function makeTagNodeSchema(): z.ZodType<TagNode> {
  return z.object({
    id: z.number(),
    uuid: z.string(),
    slug: z.string(),
    name: z.string(),
    color: z.string(),
    permalink: z.string(),
    questions: z.array(QuestionNodeSchema).default([]),
    subtags: z.array(z.lazy(() => _TagNodeSchema)).default([]),
  }).transform((data) => ({
    ...data,
    children: data.subtags,
  }));
}

const _TagNodeSchema = makeTagNodeSchema();
export const TagNodeSchema = _TagNodeSchema;

export const WorkspaceStateSchema: z.ZodType<{
  treeData: TagNode[];
  untaggedQuestions: QuestionNode[];
}> = z.object({
  treeData: z.array(TagNodeSchema),
  untaggedQuestions: z.array(QuestionNodeSchema),
});
