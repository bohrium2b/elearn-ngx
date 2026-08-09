import { z } from "zod";
import type { TaxonomyNode, Course, Part, Unit, Topic, ContentAssignment, UserProgress, TaxonomyTag, Exercise, AllResources, TaxonomyQuestion, TopicTag, TopicExercise } from "@/components/taxonomy/types";

export const TaxonomyTagSchema: z.ZodType<TaxonomyTag> = z.object({
  id: z.number(),
  name: z.string(),
  color: z.string(),
});

export const TaxonomyQuestionSchema: z.ZodType<TaxonomyQuestion> = z.object({
  id: z.number(),
  uuid: z.string(),
  slug: z.string(),
  path_identifier: z.string(),
  question: z.string(),
  type: z.string(),
  tags: z.array(TaxonomyTagSchema).default([]),
});

function makeTaxonomyNodeSchema(): z.ZodType<TaxonomyNode> {
  return z.object({
    id: z.number(),
    uuid: z.string(),
    slug: z.string(),
    path_identifier: z.string(),
    name: z.string(),
    level: z.enum(["course", "part", "unit", "topic"]),
    parent_id: z.number().nullable().default(null),
    course_id: z.number().nullable().default(null),
    position: z.number(),
    description: z.string().nullable().default(null),
    metadata: z.record(z.string(), z.unknown()).default({}),
    children_count: z.number(),
    questions_count: z.number(),
    created_at: z.string(),
    updated_at: z.string(),
    children: z.array(z.lazy(() => _TaxonomyNodeSchema)).default([]),
    questions: z.array(TaxonomyQuestionSchema).default([]),
  });
}

const _TaxonomyNodeSchema = makeTaxonomyNodeSchema();
export const TaxonomyNodeSchema: z.ZodType<TaxonomyNode> = _TaxonomyNodeSchema;

function makeCourseSchema(): z.ZodType<Course> {
  return z.object({
    id: z.number(),
    uuid: z.string(),
    slug: z.string(),
    path_identifier: z.string(),
    name: z.string(),
    level: z.literal("course"),
    parent_id: z.number().nullable().default(null),
    course_id: z.number().nullable().default(null),
    position: z.number(),
    description: z.string().nullable().default(null),
    metadata: z.record(z.string(), z.unknown()).default({}),
    children_count: z.number(),
    questions_count: z.number(),
    created_at: z.string(),
    updated_at: z.string(),
    children: z.array(z.lazy(() => _TaxonomyNodeSchema)).default([]),
    questions: z.array(TaxonomyQuestionSchema).default([]),
    parts: z.array(z.lazy(() => _PartSchema)).default([]),
    parts_count: z.number().default(0),
    topics_count: z.number().default(0),
  });
}

const _CourseSchema = makeCourseSchema();
export const CourseSchema: z.ZodType<Course> = _CourseSchema;

function makePartSchema(): z.ZodType<Part> {
  return z.object({
    id: z.number(),
    uuid: z.string(),
    slug: z.string(),
    path_identifier: z.string(),
    name: z.string(),
    level: z.literal("part"),
    parent_id: z.number().nullable().default(null),
    course_id: z.number().nullable().default(null),
    position: z.number(),
    description: z.string().nullable().default(null),
    metadata: z.record(z.string(), z.unknown()).default({}),
    children_count: z.number(),
    questions_count: z.number(),
    created_at: z.string(),
    updated_at: z.string(),
    children: z.array(z.lazy(() => _TaxonomyNodeSchema)).default([]),
    questions: z.array(TaxonomyQuestionSchema).default([]),
    units: z.array(z.lazy(() => _UnitSchema)).default([]),
  });
}

const _PartSchema = makePartSchema();
export const PartSchema: z.ZodType<Part> = _PartSchema;

function makeUnitSchema(): z.ZodType<Unit> {
  return z.object({
    id: z.number(),
    uuid: z.string(),
    slug: z.string(),
    path_identifier: z.string(),
    name: z.string(),
    level: z.literal("unit"),
    parent_id: z.number().nullable().default(null),
    course_id: z.number().nullable().default(null),
    position: z.number(),
    description: z.string().nullable().default(null),
    metadata: z.record(z.string(), z.unknown()).default({}),
    children_count: z.number(),
    questions_count: z.number(),
    created_at: z.string(),
    updated_at: z.string(),
    children: z.array(z.lazy(() => _TaxonomyNodeSchema)).default([]),
    questions: z.array(TaxonomyQuestionSchema).default([]),
    topics: z.array(z.lazy(() => _TopicSchema)).default([]),
  });
}

const _UnitSchema = makeUnitSchema();
export const UnitSchema: z.ZodType<Unit> = _UnitSchema;

function makeTopicSchema(): z.ZodType<Topic> {
  return z.object({
    id: z.number(),
    uuid: z.string(),
    slug: z.string(),
    path_identifier: z.string(),
    name: z.string(),
    level: z.literal("topic"),
    parent_id: z.number().nullable().default(null),
    course_id: z.number().nullable().default(null),
    position: z.number(),
    description: z.string().nullable().default(null),
    metadata: z.record(z.string(), z.unknown()).default({}),
    children_count: z.number(),
    questions_count: z.number(),
    created_at: z.string(),
    updated_at: z.string(),
    children: z.array(z.lazy(() => _TaxonomyNodeSchema)).default([]),
    questions: z.array(TaxonomyQuestionSchema).default([]),
    tags: z.array(TaxonomyTagSchema).default([]),
  });
}

const _TopicSchema = makeTopicSchema();
export const TopicSchema: z.ZodType<Topic> = _TopicSchema;

export const ContentAssignmentSchema: z.ZodType<ContentAssignment> = z.object({
  id: z.number(),
  taxonomy_node_id: z.number(),
  question_id: z.number(),
  position: z.number(),
  created_at: z.string(),
});

export const ExerciseSchema: z.ZodType<Exercise> = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  uuid: z.string(),
  path_identifier: z.string(),
  spec: z.object({
    description: z.string().default(""),
    selection_rules: z.array(
      z.object({
        type: z.string(),
        tag_uuid: z.string().default(""),
        count: z.number().default(0),
        question_uuid: z.string().default(""),
      }),
    ).default([]),
  }),
});

export const TopicTagSchema: z.ZodType<TopicTag> = z.object({
  id: z.number(),
  taxonomy_node_id: z.number(),
  tag_id: z.number(),
  tag_name: z.string(),
  tag_color: z.string(),
  tag_slug: z.string(),
  created_at: z.string(),
});

export const TopicExerciseSchema: z.ZodType<TopicExercise> = z.object({
  id: z.number(),
  taxonomy_node_id: z.number(),
  exercise_id: z.number(),
  exercise_name: z.string(),
  exercise_slug: z.string(),
  position: z.number(),
  created_at: z.string(),
});

export const AllResourcesSchema: z.ZodType<AllResources> = z.object({
  tags: z.array(TaxonomyTagSchema).default([]),
  questions: z.array(TaxonomyQuestionSchema).default([]),
  exercises: z.array(ExerciseSchema).default([]),
});

export const UserProgressSchema: z.ZodType<UserProgress> = z.object({
  total_topics: z.number(),
  completed_topics: z.number(),
  percentage: z.number(),
});
