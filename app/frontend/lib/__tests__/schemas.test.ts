import { describe, it, expect } from "vitest";
import {
  WorkspaceStateSchema,
  QuestionNodeSchema,
  TagNodeSchema,
} from "@/lib/schemas/workspace";
import {
  ExerciseStartResponseSchema,
  ResolvedQuestionSchema,
} from "@/lib/schemas/exercise";
import {
  DashboardDataSchema,
  LedgerEntrySchema,
  CohortMetricsSchema,
} from "@/lib/schemas/analytics";
import {
  TaxonomyNodeSchema,
  CourseSchema,
  ContentAssignmentSchema,
} from "@/lib/schemas/taxonomy";

describe("WorkspaceStateSchema", () => {
  it("parses valid workspace state", () => {
    const data = {
      treeData: [
        {
          id: 1,
          uuid: "tag-1",
          slug: "algebra",
          name: "Algebra",
          color: "#ff0000",
          permalink: "/tags/1",
          questions: [],
          subtags: [],
        },
      ],
      untaggedQuestions: [],
    };
    expect(() => WorkspaceStateSchema.parse(data)).not.toThrow();
  });

  it("rejects missing required fields", () => {
    expect(() => WorkspaceStateSchema.parse({ treeData: [], untaggedQuestions: "bad" })).toThrow();
  });
});

describe("QuestionNodeSchema", () => {
  it("parses valid question node", () => {
    const data = {
      id: 1,
      uuid: "q-1",
      slug: "what-is-2-plus-2",
      label: "What is 2+2?",
      question: "What is 2+2?",
      choices: [{ content: "3", correct: false }, { content: "4", correct: true }],
      hints: [],
      numChoices: 1,
      showPath: "/questions/1",
      updatePath: "/questions/1",
      source_tag_id: null,
    };
    expect(() => QuestionNodeSchema.parse(data)).not.toThrow();
  });

  it("rejects question with invalid choice shape", () => {
    expect(() =>
      QuestionNodeSchema.parse({
        id: 1,
        uuid: "q-1",
        slug: "test",
        label: "Test",
        question: "Test question",
        choices: [{ content: "A" }],
        hints: [],
        numChoices: 1,
        showPath: "/questions/1",
        updatePath: "/questions/1",
        source_tag_id: null,
      }),
    ).toThrow();
  });
});

describe("TagNodeSchema", () => {
  it("parses valid tag node", () => {
    const data = {
      id: 1,
      uuid: "tag-1",
      slug: "algebra",
      name: "Algebra",
      color: "#ff0000",
      permalink: "/tags/1",
      questions: [],
      subtags: [],
    };
    expect(() => TagNodeSchema.parse(data)).not.toThrow();
  });

  it("supports nested subtags", () => {
    const data = {
      id: 1,
      uuid: "tag-1",
      slug: "math",
      name: "Math",
      color: "#000000",
      permalink: "/tags/1",
      questions: [],
      subtags: [
        {
          id: 2,
          uuid: "tag-2",
          slug: "algebra",
          name: "Algebra",
          color: "#ff0000",
          permalink: "/tags/2",
          questions: [],
          subtags: [],
        },
      ],
    };
    expect(() => TagNodeSchema.parse(data)).not.toThrow();
  });
});

describe("ExerciseStartResponseSchema", () => {
  it("parses valid exercise start response", () => {
    const data = {
      title: "Test Exercise",
      questions: [
        {
          uuid: "q-1",
          content: "What is 2+2?",
          options: [
            { content: "3", correct: false },
            { content: "4", correct: true },
          ],
          hints: [],
          numChoices: 1,
          type: "multi-choice",
        },
      ],
    };
    expect(() => ExerciseStartResponseSchema.parse(data)).not.toThrow();
  });
});

describe("ResolvedQuestionSchema", () => {
  it("parses valid resolved question", () => {
    const data = {
      uuid: "q-1",
      content: "What is 2+2?",
      options: [
        { content: "3", correct: false },
        { content: "4", correct: true },
      ],
      hints: [],
      numChoices: 1,
      type: "multi-choice",
    };
    expect(() => ResolvedQuestionSchema.parse(data)).not.toThrow();
  });
});

describe("DashboardDataSchema", () => {
  it("parses valid dashboard data", () => {
    const data = {
      summary: {
        total_sessions: 10,
        average_score: 0.8,
        recent_sessions_count: 3,
        recent_average_score: 0.75,
        weekly_sessions_count: 5,
        weekly_average_score: 0.8,
        total_questions_answered: 50,
        total_correct: 40,
        current_streak: 3,
      },
      ledger: [],
      weak_points: [],
      recommendations: [],
    };
    expect(() => DashboardDataSchema.parse(data)).not.toThrow();
  });
});

describe("LedgerEntrySchema", () => {
  it("parses valid ledger entry", () => {
    const data = {
      id: 1,
      uuid: "ledger-1",
      exercise_id: 1,
      exercise_title: "Test",
      score_percentage: 0.8,
      total_questions: 10,
      correct_count: 8,
      duration_seconds: 120,
      completed_at: "2024-01-01T00:00:00Z",
      review_path: "/review/1",
    };
    expect(() => LedgerEntrySchema.parse(data)).not.toThrow();
  });
});

describe("CohortMetricsSchema", () => {
  it("parses valid cohort metrics", () => {
    const data = {
      total_sessions: 100,
      unique_students: 20,
      average_score: 0.75,
      median_score: 0.8,
      average_duration_seconds: 300,
      grade_distribution: {},
      completion_trend: {},
    };
    expect(() => CohortMetricsSchema.parse(data)).not.toThrow();
  });
});

describe("TaxonomyNodeSchema", () => {
  it("parses valid taxonomy node", () => {
    const data = {
      id: 1,
      uuid: "node-1",
      slug: "math",
      path_identifier: "math",
      name: "Mathematics",
      level: "topic",
      parent_id: null,
      course_id: 1,
      position: 1,
      description: "Math topics",
      metadata: {},
      children_count: 0,
      questions_count: 0,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
      children: [],
      questions: [],
    };
    expect(() => TaxonomyNodeSchema.parse(data)).not.toThrow();
  });
});

describe("CourseSchema", () => {
  it("parses valid course", () => {
    const data = {
      id: 1,
      uuid: "course-1",
      slug: "algebra-101",
      path_identifier: "algebra-101",
      name: "Algebra 101",
      level: "course",
      parent_id: null,
      course_id: null,
      position: 1,
      description: "Intro to algebra",
      metadata: {},
      children_count: 2,
      questions_count: 10,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
      children: [],
      questions: [],
      parts: [],
      parts_count: 0,
      topics_count: 0,
    };
    expect(() => CourseSchema.parse(data)).not.toThrow();
  });
});

describe("ContentAssignmentSchema", () => {
  it("parses valid content assignment", () => {
    const data = {
      id: 1,
      taxonomy_node_id: 1,
      question_id: 1,
      position: 1,
      created_at: "2024-01-01T00:00:00Z",
    };
    expect(() => ContentAssignmentSchema.parse(data)).not.toThrow();
  });
});
