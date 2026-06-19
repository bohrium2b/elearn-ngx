# Controllers Documentation

## Table of Contents

- [Overview](#overview)
- [ApplicationController](#applicationcontroller)
- [QuestionsController](#questionscontroller)
- [ExercisesController](#exercisescontroller)
- [TagController](#tagcontroller)
- [WorkspaceController](#workspacecontroller)
- [HomeController](#homecontroller)
- [AnalyticsController](#analyticscontroller)
- [TaxonomyNodesController](#taxonomynodescontroller)
- [TopicTagsController](#topictagscontroller)
- [TopicExercisesController](#topicexercisescontroller)
- [ContentAssignmentsController](#contentassignmentscontroller)
- [LearningPathwaysController](#learningpathwayscontroller)
- [Admin::UsersController](#adminuserscontroller)
- [Admin::TaxonomyNodesController](#admintaxonomynodescontroller)
- [Api::AssessmentSessionsController](#apiassessmentsessionscontroller)
- [Api::ClassifyQuestionsController](#apiclassifyquestionscontroller)
- [Api::AnalyticsController](#apianalyticscontroller)
- [Users::RegistrationsController](#usersregistrationscontroller)
- [Users::SessionsController](#userssessionscontroller)
- [Users::PasswordsController](#userspasswordscontroller)

## Overview

Controllers in elearn-ngx handle HTTP requests, interact with models and services, and return responses in JSON or HTML format. Most controllers support content negotiation via the `Accept` header.

**Common Patterns:**
- `before_action` for authentication and authorization
- `respond_to` blocks for multi-format responses
- Private `serialize_*` methods for JSON serialization
- Pundit policies for authorization

---

## ApplicationController

Base controller with shared functionality for all controllers.

### Location
`app/controllers/application_controller.rb`

### Key Features

**Authentication:**
- Includes Pundit::Authorization
- Configures Devise permitted parameters
- Stores user location for post-login redirect

**Security:**
- `protect_from_forgery with: :exception`
- `allow_browser versions: :modern`

**Rescue Handlers:**
- `rescue_from Pundit::NotAuthorizedError` - Redirects with alert

### Protected Methods

```ruby
configure_permitted_parameters  # Devise parameter sanitization
user_not_authorized            # Handle unauthorized access
storable_location?             # Check if location should be stored
store_user_location!           # Store location for redirect
after_sign_in_path_for         # Redirect after sign in
```

---

## QuestionsController

Manages CRUD operations for questions.

### Location
`app/controllers/questions_controller.rb`

### Actions

| Action | Methods | Description |
|--------|---------|-------------|
| index | GET | List all questions (JSON) |
| show | GET | Show question (HTML/JSON) |
| new | GET | New question form |
| edit | GET | Edit question form |
| create | POST | Create question |
| update | PATCH | Update question |
| destroy | DELETE | Delete question |

### Authentication
- Requires authentication except for `index` and `show`

### Key Methods

#### `find_question_by_param(param)`
Finds questions by UUID, slug, or ID.

**Lookup Order:**
1. UUID (first 36 chars if length >= 36)
2. UUID (full key)
3. Slug
4. Database ID

#### `serialize_question(question)`
Returns question data for JSON responses.

**Response Format:**
```ruby
{
  id: 1,
  uuid: "uuid",
  slug: "slug",
  code: "Q001",
  label: "Q001",
  question: "Question text",
  choices: [...],
  hints: [...],
  numChoices: 1,
  showPath: "/questions/uuid-x:slug",
  updatePath: "/questions/uuid-x:slug",
  source_tag_id: nil
}
```

### Validation

- Question text: minimum 10 characters
- Choices: at least 2 required
- At least 1 correct choice required

---

## ExercisesController

Manages exercises and exercise sessions.

### Location
`app/controllers/exercises_controller.rb`

### Actions

| Action | Methods | Description |
|--------|---------|-------------|
| index | GET | List exercises |
| show | GET | Show exercise |
| new | GET | New exercise form |
| edit | GET | Edit exercise form |
| create | POST | Create exercise |
| update | PATCH | Update exercise |
| destroy | DELETE | Delete exercise |
| start | GET | Start exercise (resolve questions) |
| practice | GET | Create practice exercise |

### Authentication
- Requires authentication except for `index`, `show`, `start`, `practice`

### Key Methods

#### `start`
Resolves exercise spec and returns questions.

**Response:**
```json
{
  "title": "Exercise Title",
  "questions": [...]
}
```

#### `practice`
Creates a practice exercise from query parameters.

**Query Parameters:**
- `tags` - Comma-separated tag UUIDs
- `questions` - Comma-separated question UUIDs
- `count` - Number of questions (default: 10)

---

## TagController

Manages hierarchical tags.

### Location
`app/controllers/tag_controller.rb`

### Actions

| Action | Methods | Description |
|--------|---------|-------------|
| index | GET | List root tags with tree |
| show | GET | Show tag with tree |
| new | GET | New tag form |
| edit | GET | Edit tag form |
| create | POST | Create tag |
| update | PATCH | Update tag |
| destroy | DELETE | Delete tag |

### Authentication
- Requires authentication except for `index` and `show`

### Key Methods

#### `find_tag_by_param(param)`
Finds tags by UUID, slug, or ID.

#### `build_tag_tree(tag)`
Recursively builds tag tree with questions.

**Response Format:**
```ruby
{
  id: 1,
  uuid: "uuid",
  name: "Tag Name",
  slug: "tag-name",
  color: "#ff0000",
  permalink: "/tag/uuid-x:name",
  type: "tag",
  questions: [...],
  children: [...]
}
```

### Slug Normalization

- Strips existing `tag-` prefix
- Parameterizes the slug
- Re-adds `tag-` prefix

---

## WorkspaceController

Main dashboard for organizing questions.

### Location
`app/controllers/workspace_controller.rb`

### Actions

| Action | Methods | Description |
|--------|---------|-------------|
| show | GET | Show workspace |
| update | PATCH | Update workspace |

### Authentication
- Requires authentication except for `show`

### Key Methods

#### `show`
Returns workspace data with tag tree and untagged questions.

**Response:**
```json
{
  "treeData": [...],
  "untaggedQuestions": [...]
}
```

#### `assemble_tree_node(tag)`
Recursively assembles tag tree with questions.

---

## HomeController

Root page controller.

### Location
`app/controllers/home_controller.rb`

### Actions

| Action | Methods | Description |
|--------|---------|-------------|
| index | GET | Home page |

### Authentication
- None required

---

## AnalyticsController

Provides analytics and reporting.

### Location
`app/controllers/analytics_controller.rb`

### Actions

| Action | Methods | Description |
|--------|---------|-------------|
| index | GET | Redirect to dashboard |
| dashboard | GET | Student dashboard |
| review | GET | Review session |
| weak_points | GET | Get weak points |
| recommendations | GET | Get recommendations |
| cohort | GET | Cohort metrics (instructor+) |
| tag_matrix | GET | Tag matrix (instructor+) |
| item_discrimination | GET | Item metrics (instructor+) |
| performance_logs | GET | Performance logs (instructor+) |

### Authentication
- Requires authentication for all actions

### Authorization

**Instructor/Admin Only:**
- `cohort`
- `tag_matrix`
- `item_discrimination`
- `performance_logs`

### Key Methods

#### `dashboard`
Returns student dashboard data.

**Response:**
```json
{
  "summary": {...},
  "ledger": [...],
  "weak_points": [...],
  "recommendations": [...]
}
```

#### `review`
Returns detailed session data for review.

**Authorization:**
- User owns session, or
- User is instructor, or
- User is admin

---

## TaxonomyNodesController

Manages the taxonomy hierarchy.

### Location
`app/controllers/taxonomy_nodes_controller.rb`

### Actions

| Action | Methods | Description |
|--------|---------|-------------|
| index | GET | List root nodes |
| show | GET | Show node |
| create | POST | Create node |
| update | PATCH | Update node |
| destroy | DELETE | Delete node |
| descendants | GET | Get descendants |
| ancestors | GET | Get ancestors |
| questions | GET | Get questions |
| all_resources | GET | Get all resources |
| tree | GET | Get full tree |
| by_level | GET | Get nodes by level |

### Authentication
- None explicitly required (add as needed)

### Key Methods

#### `serialize_node(node)`
Returns node data for JSON responses.

**Response Format:**
```ruby
{
  id: 1,
  uuid: "uuid",
  slug: "slug",
  path_identifier: "uuid-x:slug",
  name: "Node Name",
  level: "course",
  parent_id: null,
  course_id: 1,
  position: 0,
  description: "Description",
  metadata: {},
  children_count: 3,
  questions_count: 0,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z"
}
```

#### `all_resources`
Returns all tags, questions, and exercises for a node.

**Response:**
```json
{
  "tags": [...],
  "questions": [...],
  "exercises": [...]
}
```

---

## TopicTagsController

Manages topic-tag associations.

### Location
`app/controllers/topic_tags_controller.rb`

### Actions

| Action | Methods | Description |
|--------|---------|-------------|
| index | GET | List topic tags |
| create | POST | Create topic tag |
| destroy | DELETE | Delete topic tag |

### Authentication
- None explicitly required

### Key Methods

#### `index`
Lists tags for a topic or all topic tags.

**Query Parameters:**
- `taxonomy_node_id` - Filter by topic

---

## TopicExercisesController

Manages topic-exercise associations.

### Location
`app/controllers/topic_exercises_controller.rb`

### Actions

| Action | Methods | Description |
|--------|---------|-------------|
| index | GET | List topic exercises |
| create | POST | Create topic exercise |
| destroy | DELETE | Delete topic exercise |

### Authentication
- None explicitly required

### Key Methods

#### `index`
Lists exercises for a topic or all topic exercises.

**Query Parameters:**
- `taxonomy_node_id` - Filter by topic

---

## ContentAssignmentsController

Manages question assignments to topics.

### Location
`app/controllers/content_assignments_controller.rb`

### Actions

| Action | Methods | Description |
|--------|---------|-------------|
| create | POST | Create assignment |
| update | PATCH | Update assignment |
| destroy | DELETE | Delete assignment |

### Authentication
- None explicitly required

---

## LearningPathwaysController

Manages student-facing learning pathways.

### Location
`app/controllers/learning_pathways_controller.rb`

### Actions

| Action | Methods | Description |
|--------|---------|-------------|
| index | GET | List courses |
| show | GET | Show course detail |
| progress | GET | Get user progress |
| start_topic | POST | Start topic |
| complete_topic | POST | Complete topic |

### Authentication
- Requires authentication for all actions

### Key Methods

#### `show`
Returns detailed course structure.

**Response:**
```json
{
  "id": 1,
  "uuid": "uuid",
  "slug": "course-slug",
  "path_identifier": "uuid-x:course-slug",
  "name": "Course Name",
  "description": "Description",
  "parts_count": 3,
  "units_count": 10,
  "topics_count": 25,
  "questions_count": 150,
  "parts": [...]
}
```

---

## Admin::UsersController

Admin user management.

### Location
`app/controllers/admin/users_controller.rb`

### Actions

| Action | Methods | Description |
|--------|---------|-------------|
| index | GET | List users |
| show | GET | Show user |
| edit | GET | Edit user form |
| update | PATCH | Update user |
| destroy | DELETE | Delete user |

### Authentication
- Requires authentication
- Requires admin role

### Authorization

```ruby
before_action :verify_admin  # Redirects non-admins
```

---

## Admin::TaxonomyNodesController

Admin taxonomy management.

### Location
`app/controllers/admin/taxonomy_nodes_controller.rb`

### Actions

| Action | Methods | Description |
|--------|---------|-------------|
| index | GET | List all nodes |
| show | GET | Show node |
| create | POST | Create node |
| update | PATCH | Update node |
| destroy | DELETE | Delete node |
| reorder | PATCH | Reorder node |
| move | PATCH | Move node |
| full_tree | GET | Get full tree |
| assemble | GET | Assemble view |

### Authentication
- Requires authentication
- Requires admin role

---

## Api::AssessmentSessionsController

API for assessment sessions.

### Location
`app/controllers/api/assessment_sessions_controller.rb`

### Actions

| Action | Methods | Description |
|--------|---------|-------------|
| index | GET | List sessions |
| show | GET | Show session |
| create | POST | Create session |

### Authentication
- Requires authentication

### Key Methods

#### `create`
Processes telemetry data and creates assessment session.

**Request Parameters:**
```ruby
{
  exercise_uuid: "uuid",
  duration_seconds: 300,
  completed_at: "2024-01-01T12:00:00Z",
  session_metadata: {},
  question_responses: [...]
}
```

---

## Api::ClassifyQuestionsController

API for question classification.

### Location
`app/controllers/api/classify_questions_controller.rb`

### Actions

| Action | Methods | Description |
|--------|---------|-------------|
| update | PATCH | Classify question |

### Key Methods

#### `update`
Moves a question from one tag to another.

**Request Parameters:**
```ruby
{
  question_id: 1,
  target_tag_id: 2,
  source_tag_id: 1  # optional
}
```

---

## Api::AnalyticsController

API for topic-based analytics.

### Location
`app/controllers/api/analytics_controller.rb`

### Actions

| Action | Methods | Description |
|--------|---------|-------------|
| topic_matrix | GET | Topic performance matrix |
| topic_performance | GET | Topic performance |
| weak_points_by_topic | GET | Weak points by topic |
| topic_recommendations | GET | Topic recommendations |

### Authentication
- Requires authentication

---

## Users::RegistrationsController

Custom Devise registrations controller.

### Location
`app/controllers/users/registrations_controller.rb`

### Key Features
- Uses `auth` layout
- Custom sign-up parameters
- Custom redirect paths

### Permitted Parameters

**Sign Up:**
- `username`
- `email`
- `password`
- `password_confirmation`

**Account Update:**
- `username`
- `email`
- `password`
- `password_confirmation`
- `current_password`
- `avatar_url`

---

## Users::SessionsController

Custom Devise sessions controller.

### Location
`app/controllers/users/sessions_controller.rb`

### Key Features
- Uses `auth` layout
- Custom redirect paths

---

## Users::PasswordsController

Custom Devise passwords controller.

### Location
`app/controllers/users/passwords_controller.rb`

### Key Features
- Uses `auth` layout
