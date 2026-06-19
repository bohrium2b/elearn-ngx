# API Documentation

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Questions API](#questions-api)
- [Exercises API](#exercises-api)
- [Tags API](#tags-api)
- [Taxonomy API](#taxonomy-api)
- [Topic Tags API](#topic-tags-api)
- [Topic Exercises API](#topic-exercises-api)
- [Content Assignments API](#content-assignments-api)
- [Learning Pathways API](#learning-pathways-api)
- [Analytics API](#analytics-api)
- [Assessment Sessions API](#assessment-sessions-api)
- [Classification API](#classification-api)
- [Admin API](#admin-api)
- [Workspace API](#workspace-api)

## Overview

The elearn-ngx API provides RESTful endpoints for managing all aspects of the learning platform. All endpoints support JSON responses and most support both HTML and JSON formats.

**Base URL:** `/`

**Content Types:**
- `application/json` for API requests
- `text/html` for web page rendering

**Common Response Format:**
```json
{
  "id": 1,
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "slug": "resource-slug",
  ...
}
```

**Error Response Format:**
```json
{
  "status": "error",
  "message": "Error description"
}
```

## Authentication

Authentication is handled via Devise. Most endpoints require authentication.

**Authentication Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| POST | `/users/sign_in` | Sign in |
| DELETE | `/users/sign_out` | Sign out |
| POST | `/users/sign_up` | Register new account |
| PATCH | `/users` | Update account |
| POST | `/users/password` | Request password reset |

---

## Questions API

### List Questions
```
GET /questions
```
Returns all questions as JSON.

**Response:**
```json
[
  {
    "id": 1,
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "slug": "question-slug",
    "code": "Q001",
    "label": "Q001",
    "question": "Question text",
    "choices": [...],
    "hints": [...],
    "numChoices": 1,
    "showPath": "/questions/550e8400-x:question-slug",
    "updatePath": "/questions/550e8400-x:question-slug",
    "source_tag_id": null
  }
]
```

### Show Question
```
GET /questions/:id
```
Returns a single question. Supports both HTML and JSON formats.

**Parameters:**
- `id` - UUID, slug, or database ID (format: `uuid-x:slug`)

### Create Question
```
POST /questions
```
Creates a new question.

**Request Body:**
```json
{
  "question": "Question text (min 10 chars)",
  "slug": "optional-slug",
  "numChoices": 1,
  "choices": [
    { "content": "Choice A", "correct": true, "rationale": "Explanation" },
    { "content": "Choice B", "correct": false, "rationale": "Explanation" }
  ],
  "hints": ["Hint 1", "Hint 2"]
}
```

**Validation Rules:**
- Question text must be at least 10 characters
- At least 2 choices required
- At least 1 correct choice required

### Update Question
```
PATCH /questions/:id
```
Updates an existing question.

**Headers:**
- `X-Inline-Edit: true` - Returns serialized question instead of redirect

### Delete Question
```
DELETE /questions/:id
```
Deletes a question.

---

## Exercises API

### List Exercises
```
GET /exercises
```
Returns all regular (non-practice) exercises.

### Show Exercise
```
GET /exercises/:id
```
Returns a single exercise.

### Create Exercise
```
POST /exercises
```
Creates a new exercise.

**Request Body:**
```json
{
  "exercise": {
    "title": "Exercise Title",
    "spec": {
      "selection_rules": [
        {
          "type": "dynamic_tag",
          "tag_uuid": "tag-uuid",
          "count": 5,
          "strategy": "random"
        },
        {
          "type": "static_question",
          "question_uuid": "question-uuid"
        }
      ]
    }
  }
}
```

### Update Exercise
```
PATCH /exercises/:id
```
Updates an existing exercise.

### Delete Exercise
```
DELETE /exercises/:id
```
Deletes an exercise.

### Start Exercise
```
GET /exercises/:id/start
```
Resolves the exercise spec and returns questions for the session.

**Response:**
```json
{
  "title": "Exercise Title",
  "questions": [
    {
      "uuid": "question-uuid",
      "content": "Question text",
      "options": [...],
      "hints": [...],
      "numChoices": 1,
      "type": "multi-choice"
    }
  ]
}
```

### Practice Exercise
```
GET /exercises/practice?tags=uuid1,uuid2&questions=uuid3,uuid4&count=10
```
Creates and redirects to a practice exercise.

**Query Parameters:**
- `tags` - Comma-separated tag UUIDs
- `questions` - Comma-separated question UUIDs
- `count` - Number of questions (default: 10)

---

## Tags API

### List Tags
```
GET /tag
```
Returns all root tags with nested children and questions.

**Response:**
```json
[
  {
    "id": 1,
    "uuid": "tag-uuid",
    "name": "Tag Name",
    "slug": "tag-name",
    "color": "#ff0000",
    "permalink": "/tag/tag-uuid-x:name",
    "type": "tag",
    "questions": [...],
    "children": [...]
  }
]
```

### Show Tag
```
GET /tag/:id
```
Returns a single tag with its tree.

### Create Tag
```
POST /tag
```
Creates a new tag.

**Request Body:**
```json
{
  "tag": {
    "name": "Tag Name",
    "slug": "optional-slug",
    "color": "#ff0000",
    "parent_id": 1
  }
}
```

**Validation Rules:**
- Slug must match format `tag-[a-z0-9-]+`
- Cannot create circular references

### Update Tag
```
PATCH /tag/:id
```
Updates an existing tag.

### Delete Tag
```
DELETE /tag/:id
```
Deletes a tag and detaches all questions.

---

## Taxonomy API

### List Root Nodes
```
GET /taxonomy
```
Returns all root nodes (courses).

### Show Node
```
GET /taxonomy/:id
```
Returns a single taxonomy node.

**Response:**
```json
{
  "id": 1,
  "uuid": "node-uuid",
  "slug": "course-macroeconomics",
  "path_identifier": "node-uuid-x:course-macroeconomics",
  "name": "Macroeconomics 101",
  "level": "course",
  "parent_id": null,
  "course_id": 1,
  "position": 0,
  "description": "Course description",
  "metadata": {},
  "children_count": 3,
  "questions_count": 0,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### Create Node
```
POST /taxonomy
```
Creates a new taxonomy node.

**Request Body:**
```json
{
  "taxonomy_node": {
    "name": "Topic Name",
    "slug": "topic-name",
    "level": "topic",
    "parent_id": 1,
    "course_id": 1,
    "position": 0,
    "description": "Description",
    "metadata": {}
  }
}
```

**Validation Rules:**
- Slug prefix must match level (e.g., `topic-` for topic level)
- Cannot create circular references
- Topic names must be unique within a course

### Update Node
```
PATCH /taxonomy/:id
```
Updates an existing node.

### Delete Node
```
DELETE /taxonomy/:id
```
Deletes a node and all descendants.

### Get Descendants
```
GET /taxonomy/:id/descendants
```
Returns all descendants of a node.

### Get Ancestors
```
GET /taxonomy/:id/ancestors
```
Returns all ancestors of a node.

### Get Questions
```
GET /taxonomy/:id/questions
```
Returns all questions assigned to a node.

### Get All Resources
```
GET /taxonomy/:id/all_resources
```
Returns all tags, questions, and exercises for a node.

**Response:**
```json
{
  "tags": [...],
  "questions": [...],
  "exercises": [...]
}
```

### Get Full Tree
```
GET /taxonomy/tree
```
Returns the complete taxonomy tree with all levels.

### Get Nodes by Level
```
GET /taxonomy/by_level?level=topic
```
Returns all nodes of a specific level.

**Valid levels:** `course`, `part`, `unit`, `topic`

---

## Topic Tags API

### List Topic Tags
```
GET /topic_tags?taxonomy_node_id=:id
```
Returns tags for a specific topic or all topic tags.

### Create Topic Tag
```
POST /topic_tags
```
Attaches a tag to a topic.

**Request Body:**
```json
{
  "topic_tag": {
    "tag_id": 1
  }
}
```

**Validation:**
- Taxonomy node must be a topic level
- Tag must be unique per topic

### Delete Topic Tag
```
DELETE /topic_tags/:id
```
Detaches a tag from a topic.

---

## Topic Exercises API

### List Topic Exercises
```
GET /topic_exercises?taxonomy_node_id=:id
```
Returns exercises for a specific topic or all topic exercises.

### Create Topic Exercise
```
POST /topic_exercises
```
Attaches an exercise to a topic.

**Request Body:**
```json
{
  "topic_exercise": {
    "exercise_id": 1,
    "position": 0
  }
}
```

**Validation:**
- Taxonomy node must be a topic level
- Exercise must be unique per topic

### Delete Topic Exercise
```
DELETE /topic_exercises/:id
```
Detaches an exercise from a topic.

---

## Content Assignments API

### Create Content Assignment
```
POST /content_assignments
```
Assigns a question to a topic.

**Request Body:**
```json
{
  "content_assignment": {
    "taxonomy_node_id": 1,
    "question_id": 1,
    "position": 0
  }
}
```

### Update Content Assignment
```
PATCH /content_assignments/:id
```
Updates an assignment.

### Delete Content Assignment
```
DELETE /content_assignments/:id
```
Removes a question from a topic.

---

## Learning Pathways API

### List Courses
```
GET /learning_pathways
```
Returns all available courses.

**Response:**
```json
[
  {
    "id": 1,
    "uuid": "course-uuid",
    "slug": "course-macroeconomics",
    "path_identifier": "course-uuid-x:course-macroeconomics",
    "name": "Macroeconomics 101",
    "description": "Course description",
    "parts_count": 3,
    "units_count": 10,
    "topics_count": 25,
    "questions_count": 150
  }
]
```

### Show Course
```
GET /learning_pathways/:id
```
Returns detailed course structure with parts, units, and topics.

### Get Progress
```
GET /learning_pathways/:id/progress
```
Returns user progress for a course.

**Response:**
```json
{
  "total_topics": 25,
  "completed_topics": 10,
  "percentage": 40
}
```

### Start Topic
```
POST /learning_pathways/:id/start_topic
```
Marks a topic as started.

**Query Parameters:**
- `topic_id` - Topic path identifier

### Complete Topic
```
POST /learning_pathways/:id/complete_topic
```
Marks a topic as completed.

---

## Analytics API

### Dashboard
```
GET /analytics/dashboard
```
Returns student dashboard data.

**Response:**
```json
{
  "summary": {
    "total_sessions": 50,
    "average_score": 75.5,
    "recent_sessions_count": 10,
    "recent_average_score": 80.0,
    "weekly_sessions_count": 5,
    "weekly_average_score": 85.0,
    "total_questions_answered": 500,
    "total_correct": 375,
    "current_streak": 7
  },
  "ledger": [...],
  "weak_points": [...],
  "recommendations": [...]
}
```

### Review Session
```
GET /analytics/:id/review
```
Returns detailed session data for review.

### Weak Points
```
GET /analytics/weak_points?window=30
```
Returns questions with low success rates.

**Query Parameters:**
- `window` - Time window in days (default: 30)

### Recommendations
```
GET /analytics/recommendations
```
Returns personalized practice recommendations.

### Cohort Metrics (Instructor/Admin only)
```
GET /analytics/cohort
```
Returns system-wide cohort metrics.

### Tag Matrix (Instructor/Admin only)
```
GET /analytics/tag_matrix
```
Returns performance matrix by tag.

### Item Discrimination (Instructor/Admin only)
```
GET /analytics/item_discrimination
```
Returns question discrimination metrics.

### Performance Logs (Instructor/Admin only)
```
GET /analytics/performance_logs
```
Returns recent assessment sessions.

---

## Assessment Sessions API

### List Sessions
```
GET /api/assessment_sessions
```
Returns recent assessment sessions for the current user.

**Query Parameters:**
- `exercise_id` - Filter by exercise

### Show Session
```
GET /api/assessment_sessions/:id
```
Returns detailed session data.

### Create Session
```
POST /api/assessment_sessions
```
Submits telemetry data and creates an assessment session.

**Request Body:**
```json
{
  "exercise_uuid": "exercise-uuid",
  "duration_seconds": 300,
  "completed_at": "2024-01-01T12:00:00Z",
  "session_metadata": {},
  "question_responses": [
    {
      "question_uuid": "question-uuid",
      "correct": true,
      "choices_selected": ["A"],
      "hints_used": 0,
      "retry_count": 0,
      "time_spent": 30
    }
  ]
}
```

**Response:**
```json
{
  "session": {
    "id": 1,
    "user_id": 1,
    "exercise_id": 1,
    "exercise_title": "Exercise Title",
    "score_percentage": 85.0,
    "duration_seconds": 300,
    "completed_at": "2024-01-01T12:00:00Z",
    "total_questions": 10,
    "correct_count": 8,
    "created_at": "2024-01-01T12:00:00Z"
  }
}
```

---

## Classification API

### Classify Question
```
PATCH /api/classify_question
```
Moves a question from one tag to another.

**Request Body:**
```json
{
  "question_id": 1,
  "target_tag_id": 2,
  "source_tag_id": 1
}
```

---

## Admin API

### List Users
```
GET /admin/users
```
Returns all users (admin only).

### Show User
```
GET /admin/users/:id
```
Returns a single user.

### Update User
```
PATCH /admin/users/:id
```
Updates a user.

**Request Body:**
```json
{
  "user": {
    "username": "new_username",
    "email": "new@email.com",
    "avatar_url": "https://...",
    "role_ids": [1, 2]
  }
}
```

### Delete User
```
DELETE /admin/users/:id
```
Deletes a user.

### Admin Taxonomy Management
```
GET /admin/taxonomy_nodes
POST /admin/taxonomy_nodes
PATCH /admin/taxonomy_nodes/:id
DELETE /admin/taxonomy_nodes/:id
PATCH /admin/taxonomy_nodes/:id/reorder
PATCH /admin/taxonomy_nodes/:id/move
GET /admin/taxonomy_nodes/full_tree
GET /admin/taxonomy_nodes/assemble
```

---

## Workspace API

### Show Workspace
```
GET /workspace
```
Returns the workspace data with tag tree and untagged questions.

**Response:**
```json
{
  "treeData": [
    {
      "id": 1,
      "uuid": "tag-uuid",
      "slug": "tag-name",
      "name": "Tag Name",
      "color": "#ff0000",
      "permalink": "/tag/tag-uuid-x:name",
      "subtags": [...],
      "questions": [...]
    }
  ],
  "untaggedQuestions": [...]
}
```

### Update Workspace
```
PATCH /workspace
```
Updates workspace (placeholder for future functionality).
