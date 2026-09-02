/**
 * types.ts – TypeScript types for the Taxonomy system
 *
 * Defines the data structures for taxonomy nodes, content assignments,
 * learning pathways, and user progress tracking.
 */

export type TaxonomyLevel = "course" | "part" | "unit" | "topic";

export interface TaxonomyNode {
  id: number;
  uuid: string;
  slug: string;
  path_identifier: string;
  name: string;
  level: TaxonomyLevel;
  parent_id: number | null;
  course_id: number | null;
  position: number;
  description: string | null;
  metadata: Record<string, unknown>;
  children_count: number;
  questions_count: number;
  created_at: string;
  updated_at: string;
  children?: TaxonomyNode[];
  questions?: Question[];
}

export interface Question {
  id: number;
  uuid: string;
  slug: string;
  path_identifier: string;
  question: string;
  type: string;
  tags: Tag[];
}

export interface Tag {
  id: number;
  name: string;
  color: string;
}

export interface ContentAssignment {
  id: number;
  taxonomy_node_id: number;
  question_id: number;
  position: number;
  created_at: string;
}

export interface Course extends TaxonomyNode {
  level: "course";
  parts: Part[];
  parts_count?: number;
  topics_count?: number;
}

export interface Part extends TaxonomyNode {
  level: "part";
  units: Unit[];
}

export interface Unit extends TaxonomyNode {
  level: "unit";
  topics: Topic[];
}

export interface Topic extends TaxonomyNode {
  level: "topic";
  questions: Question[];
  tags: Tag[];
}

// Exercise interface for topic-exercise associations
export interface Exercise {
  id: number;
  name: string;
  slug: string;
  uuid: string;
  path_identifier: string;
  spec: {
    description?: string;
    selection_rules?: Array<{
      type: string;
      tag_uuid?: string;
      count?: number;
      question_uuid?: string;
    }>;
  };
}

// TopicTag interface for topic-tag associations
export interface TopicTag {
  id: number;
  taxonomy_node_id: number;
  tag_id: number;
  tag_name: string;
  tag_color: string;
  tag_slug: string;
  created_at: string;
}

// TopicExercise interface for topic-exercise associations
export interface TopicExercise {
  id: number;
  taxonomy_node_id: number;
  exercise_id: number;
  exercise_name: string;
  exercise_slug: string;
  position: number;
  created_at: string;
}

// AllResources interface for the all_resources API response
export interface AllResources {
  tags: Tag[];
  questions: Question[];
  exercises: Exercise[];
}

export interface UserProgress {
  total_topics: number;
  completed_topics: number;
  completed_topic_ids: number[];
  percentage: number;
}

export interface TreeNodeState {
  expanded: boolean;
  selected: boolean;
  loading: boolean;
}
