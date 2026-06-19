# elearn-ngx Features Overview

## Table of Contents

- [Introduction](#introduction)
- [Core Features](#core-features)
  - [Question Management](#question-management)
  - [Exercise System](#exercise-system)
  - [Tagging System](#tagging-system)
  - [Taxonomy System](#taxonomy-system)
  - [Learning Pathways](#learning-pathways)
  - [Analytics & Reporting](#analytics--reporting)
  - [Assessment Sessions](#assessment-sessions)
  - [Practice Exercises](#practice-exercises)
- [User Roles & Permissions](#user-roles--permissions)
- [API Features](#api-features)

## Introduction

elearn-ngx is an interactive economics learning platform built with Ruby on Rails and React. The platform provides a comprehensive system for managing educational content, tracking student performance, and delivering personalized learning experiences.

## Core Features

### Question Management

The question system allows creating, editing, and organizing multi-choice questions.

**Key Capabilities:**
- Create and edit multi-choice questions with multiple correct answers
- Add hints to guide students through problem-solving
- Support for Markdown in question text
- UUID and slug-based identification for URL-friendly access
- Validation to ensure question integrity (minimum length, at least 2 choices, at least 1 correct answer)

**Question Structure:**
```json
{
  "question": "Question text (Markdown supported)",
  "choices": [
    { "content": "Choice A", "correct": true, "rationale": "Explanation" },
    { "content": "Choice B", "correct": false, "rationale": "Explanation" }
  ],
  "hints": ["Hint 1", "Hint 2", "Hint 3"],
  "numChoices": 1,
  "type": "multi-choice"
}
```

**URL Format:** `/questions/:uuid-x:slug`

---

### Exercise System

Exercises are collections of questions that can be dynamically generated or statically defined.

**Key Capabilities:**
- **Dynamic Tag-based Selection:** Randomly select N questions from a tag branch
- **Static Question Selection:** Include specific questions by UUID
- **Practice Exercises:** Auto-generated exercises targeting weak areas
- **Exercise Resolution:** Resolves spec into actual questions at runtime

**Exercise Spec Structure:**
```json
{
  "selection_rules": [
    {
      "type": "dynamic_tag",
      "tag_uuid": "tag-uuid-here",
      "count": 5,
      "strategy": "random"
    },
    {
      "type": "static_question",
      "question_uuid": "question-uuid-here"
    }
  ]
}
```

**Validation Rules:**
- Prevents over-selection (cannot request more questions than available)
- Prevents family overlap (cannot select from both parent and child tags)
- Ensures spec structure integrity

**URL Format:** `/exercises/:uuid-x:slug`

---

### Tagging System

Tags provide a flexible, hierarchical categorization system for questions.

**Key Capabilities:**
- Hierarchical structure with parent-child relationships
- Color-coded tags for visual organization
- Many-to-many relationship with questions
- Prevents circular references in hierarchy
- Calculates total questions in branch (including descendants)

**Tag Structure:**
- `name`: Display name
- `slug`: URL-friendly identifier (format: `tag-name`)
- `uuid`: Unique identifier
- `color`: Hex color code (auto-generated if not provided)
- `parent_id`: Reference to parent tag

**URL Format:** `/tag/:uuid-x:slug`

---

### Taxonomy System

The taxonomy system provides a structured, multi-level curriculum organization.

**Hierarchy Levels:**
```
Course (e.g., "Macroeconomics 101")
  └── Part (e.g., "Part 1: Monetary Policy")
        └── Unit (e.g., "Unit 3: Central Banking Mechanics")
              └── Topic (e.g., "The Reserve Ratio")
```

**Key Capabilities:**
- Four-level hierarchy: Course → Part → Unit → Topic
- UUID + slug identity system with type prefixes
- Self-referential parent-child relationships
- Prevents circular references
- Enforces intra-course topic uniqueness
- Supports ordering within siblings
- Metadata storage for flexible data

**Slug Prefixes:**
- `course-` for courses
- `part-` for parts
- `unit-` for units
- `topic-` for topics

**URL Format:** `/taxonomy/:uuid-x:slug`

**Topic Resources:**
- Topics can have multiple tags (through TopicTag)
- Topics can have multiple exercises (through TopicExercise)
- Topics can have multiple questions (through ContentAssignment)

---

### Learning Pathways

Learning pathways provide a structured, gamified learning experience.

**Key Capabilities:**
- Browse available courses
- View course structure (parts, units, topics)
- Track progress through topics
- Start and complete topics
- View questions count per topic

**URL Format:** `/learning_pathways/:id`

---

### Analytics & Reporting

Comprehensive analytics system for tracking student performance and generating insights.

**Student Analytics:**
- Dashboard summary (total sessions, average scores, streaks)
- Chronological ledger of assessment sessions
- Weak points identification (questions with <50% success rate)
- Personalized recommendations
- Topic-based performance tracking
- Mastery level classification

**Mastery Levels:**
| Score Range | Level |
|-------------|-------|
| 90-100% | mastered |
| 70-89% | proficient |
| 50-69% | developing |
| 0-49% | needs_improvement |

**Instructor/Admin Analytics:**
- Cohort metrics (total sessions, unique students, grade distribution)
- Tag performance matrix
- Item discrimination metrics (identifies problematic questions)
- Performance logs
- Topic performance matrices
- Difficulty rankings

**Difficulty Classification:**
| Average Score | Difficulty |
|---------------|------------|
| 0-39% | hard |
| 40-69% | medium |
| 70-100% | easy |

---

### Assessment Sessions

Assessment sessions track student performance on exercises.

**Key Capabilities:**
- Records score percentage, duration, and completion time
- Stores detailed telemetry data (question responses, tag registry, topic registry)
- Supports review of past sessions
- Calculates correct count and total questions
- Formatted duration display

**Telemetry Data Structure:**
```json
{
  "session_metadata": {},
  "question_responses": [
    {
      "question_uuid": "uuid",
      "correct": true,
      "choices_selected": ["A"],
      "hints_used": 0,
      "retry_count": 0,
      "time_spent": 30
    }
  ],
  "tag_registry": {},
  "topic_registry": {}
}
```

---

### Practice Exercises

Practice exercises are auto-generated to target student weak areas.

**Key Capabilities:**
- Generate exercises from specific tags
- Generate exercises from specific questions
- Auto-detect weak areas based on performance history
- Excludes already attempted questions
- Configurable question count (default: 10)

**Generation Strategy:**
1. If question UUIDs provided → use those specific questions
2. If tag UUIDs provided → fetch questions from those tags
3. Otherwise → identify weak tags and fetch questions from them

---

## User Roles & Permissions

The system uses Role-Based Access Control (RBAC) with four roles:

| Role | Description |
|------|-------------|
| `student` | Default role, can view content and track own progress |
| `content_author` | Can create and manage questions, exercises, and content |
| `instructor` | Can view all student data, cohort analytics, and performance logs |
| `admin` | Full system access, can manage users and taxonomy |

**Permission Checks:**
- `student?` - Has student role
- `content_author?` - Has content author role
- `instructor?` - Has instructor role
- `admin?` - Has admin role

---

## API Features

The platform provides a comprehensive REST API for all operations.

**Authentication:**
- Token-based authentication via Devise
- Session management for web users

**Response Formats:**
- JSON for API requests
- HTML for web page rendering
- Content negotiation via `Accept` header

**Key API Patterns:**
- UUID/slug-based resource lookup
- Consistent error response format
- Pagination support for large collections
- Eager loading for performance

---

## Frontend Architecture

The frontend uses an "islands" architecture with React components mounted as web components.

**Key Components:**
- `<workspace-dashboard>` - Main drag-and-drop interface
- `<course-library>` - Hierarchical browser for courses
- `<course-pathway>` - Gamified linear pathway view
- `<course-assembler>` - Admin drag-and-drop dashboard

**Build System:**
- Vite for frontend bundling
- TypeScript for type safety
- MUI components for UI consistency
