# Models Documentation

## Table of Contents

- [Overview](#overview)
- [User](#user)
- [Role](#role)
- [Question](#question)
- [Exercise](#exercise)
- [Tag](#tag)
- [TaxonomyNode](#taxonomynode)
- [TopicTag](#topictag)
- [TopicExercise](#topicexercise)
- [ContentAssignment](#contentassignment)
- [AssessmentSession](#assessmentsession)
- [Entity Relationship Diagram](#entity-relationship-diagram)

## Overview

The elearn-ngx platform uses ActiveRecord models with UUID-based identification, hierarchical relationships, and JSON data storage for flexible content management.

**Common Patterns:**
- UUID generation on create
- Slug generation for URL-friendly identifiers
- `to_param` method for path generation (format: `uuid-x:slug`)
- Find by param pattern (UUID, slug, or ID lookup)

---

## User

Represents a user in the system with role-based access control.

### Attributes

| Column | Type | Description |
|--------|------|-------------|
| email | string | Unique email address |
| username | string | Unique username (3-30 chars, alphanumeric + underscore) |
| encrypted_password | string | Devise encrypted password |
| avatar_url | string | Optional avatar URL |
| created_at | datetime | Creation timestamp |
| updated_at | datetime | Last update timestamp |

### Associations

```ruby
has_many :assessment_sessions, dependent: :destroy
has_and_belongs_to_many :roles, join_table: :users_roles
```

### Validations

- Email: required, unique
- Username: required, unique, 3-30 characters, format: `/\A[a-zA-Z0-9_]+\z/`

### Role Methods

```ruby
user.student?           # Has student role
user.content_author?    # Has content author role
user.instructor?        # Has instructor role
user.admin?             # Has admin role
user.role_name          # Returns first role name or "student"
```

### Callbacks

- `after_create :assign_default_role` - Assigns student role by default

### Devise Modules

- `:database_authenticatable` - Password storage
- `:registerable` - Self-registration
- `:recoverable` - Password reset
- `:rememberable` - Remember me
- `:validatable` - Email/password validation
- `:trackable` - Sign in tracking

---

## Role

Represents a user role for authorization.

### Attributes

| Column | Type | Description |
|--------|------|-------------|
| name | string | Role name (unique) |
| resource_type | string | Polymorphic resource type |
| resource_id | integer | Polymorphic resource ID |

### Valid Roles

```ruby
Role::ROLES = %w[student content_author instructor admin]
```

### Associations

```ruby
has_and_belongs_to_many :users, join_table: :users_roles
belongs_to :resource, polymorphic: true, optional: true
```

---

## Question

Represents a multi-choice question with configurable options.

### Attributes

| Column | Type | Description |
|--------|------|-------------|
| uuid | string | Unique identifier |
| slug | string | URL-friendly identifier |
| config_data | jsonb | Question configuration data |
| created_at | datetime | Creation timestamp |
| updated_at | datetime | Last update timestamp |

### Config Data Structure

```json
{
  "question": "Question text (Markdown supported)",
  "choices": [
    {
      "content": "Choice text",
      "correct": true,
      "rationale": "Explanation for this choice"
    }
  ],
  "hints": ["Hint 1", "Hint 2", "Hint 3"],
  "numChoices": 1,
  "type": "multi-choice"
}
```

### Associations

```ruby
has_and_belongs_to_many :tags
has_many :content_assignments, dependent: :destroy
has_many :topics, through: :content_assignments, source: :taxonomy_node
```

### Scopes

```ruby
Question.untagged  # Questions without any tags
```

### Methods

```ruby
question.to_param  # Returns "uuid-x:slug"
question.ensure_uuid  # Generates UUID if missing
question.ensure_slug  # Generates unique slug if missing
```

### Callbacks

- `before_validation :ensure_uuid, on: :create`
- `before_validation :ensure_slug, on: :create`

---

## Exercise

Represents a collection of questions with selection rules.

### Attributes

| Column | Type | Description |
|--------|------|-------------|
| uuid | string | Unique identifier |
| slug | string | URL-friendly identifier |
| title | string | Exercise title |
| spec | jsonb | Selection rules configuration |
| is_practice | boolean | Whether this is a auto-generated practice exercise |
| created_at | datetime | Creation timestamp |
| updated_at | datetime | Last update timestamp |

### Spec Structure

```json
{
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
```

### Associations

```ruby
belongs_to :primary_topic, class_name: "TaxonomyNode", optional: true
has_many :topic_exercises, dependent: :destroy
has_many :topics, through: :topic_exercises, source: :taxonomy_node
has_many :assessment_sessions, dependent: :destroy
```

### Scopes

```ruby
Exercise.regular   # Non-practice exercises
Exercise.practice  # Auto-generated practice exercises
```

### Validations

- Title: required
- Slug: required, unique
- Spec: required, must have valid structure
- Cannot over-select questions from tags
- Cannot have family overlap in dynamic_tag rules

### Methods

```ruby
exercise.path_identifier  # Returns "uuid-x:slug"
exercise.practice?        # Returns true if is_practice
exercise.generate_slug    # Generates unique slug from title

# Class method
Exercise.find_by_uuid_or_slug_or_id(param)  # Find by UUID, slug, or ID
```

---

## Tag

Represents a hierarchical categorization for questions.

### Attributes

| Column | Type | Description |
|--------|------|-------------|
| uuid | string | Unique identifier |
| slug | string | URL-friendly identifier (format: `tag-name`) |
| name | string | Display name |
| color | string | Hex color code |
| parent_id | integer | Reference to parent tag |
| taxonomy_node_id | integer | Optional reference to taxonomy node |

### Associations

```ruby
belongs_to :parent, class_name: "Tag", optional: true
belongs_to :taxonomy_node, optional: true
has_many :children, class_name: "Tag", foreign_key: "parent_id", dependent: :destroy, inverse_of: :parent
has_and_belongs_to_many :questions
has_many :topic_tags, dependent: :destroy
has_many :topics, through: :topic_tags, source: :taxonomy_node
```

### Validations

- Name: required
- Slug: required, format: `/\Atag-[a-z0-9-]+\z/`
- UUID: required, unique
- Color: required
- Cannot create circular parent references

### Methods

```ruby
tag.to_param  # Returns "uuid-x:slug-without-prefix"

# Hierarchy methods
tag.all_descendants           # Returns all descendant tags
tag.total_questions_in_branch  # Count of questions in this tag and descendants
tag.ancestor_of?(other_tag)   # Check if this tag is ancestor of another
tag.is_ancestor_of?(other_tag) # Alias for ancestor_of?
```

### Callbacks

- `before_validation :ensure_uuid, on: :create`
- `before_validation :generate_slug, on: :create`
- `before_validation :assign_random_color, on: :create`
- `before_destroy :detach_questions` - Removes all question associations

---

## TaxonomyNode

Represents a node in the curriculum hierarchy (Course → Part → Unit → Topic).

### Attributes

| Column | Type | Description |
|--------|------|-------------|
| uuid | string | Unique identifier |
| slug | string | URL-friendly identifier with level prefix |
| name | string | Display name |
| level | integer | Enum: course(0), part(1), unit(2), topic(3) |
| parent_id | integer | Reference to parent node |
| course_id | integer | Reference to root course |
| position | integer | Ordering within siblings |
| description | text | Node description |
| metadata | jsonb | Flexible metadata storage |

### Associations

```ruby
belongs_to :parent, class_name: "TaxonomyNode", optional: true
belongs_to :course, class_name: "TaxonomyNode", optional: true
has_many :children, class_name: "TaxonomyNode", foreign_key: :parent_id, dependent: :destroy, inverse_of: :parent
has_many :content_assignments, dependent: :destroy
has_many :questions, through: :content_assignments
has_many :tags, dependent: :nullify
has_many :topic_tags, dependent: :destroy
has_many :topic_exercises, dependent: :destroy
has_many :exercises, through: :topic_exercises
has_many :assessment_sessions, dependent: :nullify
```

### Scopes

```ruby
TaxonomyNode.roots      # Root nodes (no parent)
TaxonomyNode.courses    # Course level nodes
TaxonomyNode.parts      # Part level nodes
TaxonomyNode.units      # Unit level nodes
TaxonomyNode.topics     # Topic level nodes
TaxonomyNode.ordered    # Order by position, name
TaxonomyNode.by_level(:topic)  # Filter by level
TaxonomyNode.for_course(course)  # Nodes belonging to a course
```

### Validations

- Name: required
- Slug: required, unique
- UUID: required, unique
- Level: required
- Slug prefix must match level (e.g., `topic-` for topic level)
- Cannot create circular references
- Topic names must be unique within a course

### Methods

```ruby
node.path_identifier  # Returns "uuid-x:slug"
node.ancestors       # Returns array of ancestor nodes
node.descendants     # Returns array of all descendant nodes

# Class method
TaxonomyNode.find_by_param(param)  # Find by UUID, slug, or ID
```

### Callbacks

- `before_validation :generate_uuid, on: :create`
- `before_validation :generate_slug, on: :create`

---

## TopicTag

Join model for many-to-many relationship between topics and tags.

### Attributes

| Column | Type | Description |
|--------|------|-------------|
| taxonomy_node_id | integer | Reference to topic |
| tag_id | integer | Reference to tag |
| created_at | datetime | Creation timestamp |

### Associations

```ruby
belongs_to :taxonomy_node
belongs_to :tag
```

### Validations

- Tag must be unique per topic
- Taxonomy node must be a topic level

---

## TopicExercise

Join model for many-to-many relationship between topics and exercises.

### Attributes

| Column | Type | Description |
|--------|------|-------------|
| taxonomy_node_id | integer | Reference to topic |
| exercise_id | integer | Reference to exercise |
| position | integer | Ordering within topic |
| created_at | datetime | Creation timestamp |

### Associations

```ruby
belongs_to :taxonomy_node
belongs_to :exercise
```

### Scopes

```ruby
TopicExercise.ordered  # Order by position
```

### Validations

- Exercise must be unique per topic
- Taxonomy node must be a topic level

---

## ContentAssignment

Join model for many-to-many relationship between topics and questions.

### Attributes

| Column | Type | Description |
|--------|------|-------------|
| taxonomy_node_id | integer | Reference to topic |
| question_id | integer | Reference to question |
| position | integer | Ordering within topic |
| created_at | datetime | Creation timestamp |

### Associations

```ruby
belongs_to :taxonomy_node
belongs_to :question
```

### Scopes

```ruby
ContentAssignment.ordered  # Order by position
```

### Validations

- Question must be unique per topic

---

## AssessmentSession

Represents a student's attempt at an exercise.

### Attributes

| Column | Type | Description |
|--------|------|-------------|
| uuid | string | Unique identifier |
| user_id | integer | Reference to user |
| exercise_id | integer | Reference to exercise |
| taxonomy_node_id | integer | Optional reference to topic |
| score_percentage | decimal | Score (0-100) |
| duration_seconds | integer | Time taken in seconds |
| completed_at | datetime | Completion timestamp |
| telemetry_data | jsonb | Detailed session data |

### Telemetry Data Structure

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
  "tag_registry": {
    "tag-uuid": {
      "name": "Tag Name",
      "slug": "tag-slug",
      "uuid": "tag-uuid",
      "parent_id": null,
      "ancestor_path": []
    }
  },
  "topic_registry": {
    "question-uuid": [
      {
        "topic_id": 1,
        "topic_name": "Topic Name",
        "topic_slug": "topic-slug",
        "path_identifier": "uuid-x:topic-slug"
      }
    ]
  },
  "topic_performance": {
    "topic_id": {
      "topic_name": "Topic Name",
      "correct": 5,
      "total": 10,
      "percentage": 50.0
    }
  }
}
```

### Associations

```ruby
belongs_to :user
belongs_to :exercise
belongs_to :taxonomy_node, optional: true
```

### Scopes

```ruby
AssessmentSession.recent              # Order by completed_at desc
AssessmentSession.for_user(user)      # Filter by user
AssessmentSession.for_exercise(exercise)  # Filter by exercise
AssessmentSession.completed_after(date)   # Completed after date
AssessmentSession.completed_before(date)  # Completed before date
AssessmentSession.in_time_window(duration) # Completed within duration
```

### Validations

- Score percentage: required, 0-100
- Completed at: required
- Telemetry data: required
- UUID: required, unique

### Methods

```ruby
session.question_responses  # Returns array of question responses
session.tag_registry        # Returns tag registry hash
session.session_metadata    # Returns session metadata hash
session.question_uuids      # Returns unique question UUIDs
session.correct_count       # Returns count of correct responses
session.total_questions     # Returns total question count
session.recalculate_score   # Recalculates score from responses
session.timed?              # Returns true if duration is set
session.formatted_duration  # Returns formatted duration string

# Class method
AssessmentSession.find_by_uuid_or_id(param)  # Find by UUID or ID
```

### Callbacks

- `before_validation :ensure_uuid, on: :create`

---

## Entity Relationship Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│      User       │     │      Role       │     │   Question      │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id              │◄────┤ id              │     │ id              │
│ email           │     │ name            │     │ uuid            │
│ username        │     │ resource_type   │     │ slug            │
│ encrypted_pass  │     │ resource_id     │     │ config_data     │
└────────┬────────┘     └─────────────────┘     └────────┬────────┘
         │                                               │
         │ 1:N                                           │ M:N
         ▼                                               ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│AssessmentSession│     │   ContentAssign │     │      Tag        │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id              │     │ id              │     │ id              │
│ uuid            │     │ taxonomy_node_id│     │ uuid            │
│ user_id         │     │ question_id     │     │ slug            │
│ exercise_id     │     │ position        │     │ name            │
│ taxonomy_node_id│     └────────┬────────┘     │ color           │
│ score_percentage│              │               │ parent_id       │
│ duration_seconds│              │ M:1           │ taxonomy_node_id│
│ completed_at    │              ▼               └────────┬────────┘
│ telemetry_data  │     ┌─────────────────┐              │
└────────┬────────┘     │  TaxonomyNode   │              │ M:N
         │              ├─────────────────┤              ▼
         │ N:1          │ id              │     ┌─────────────────┐
         ▼              │ uuid            │     │    TopicTag     │
┌─────────────────┐     │ slug            │     ├─────────────────┤
│    Exercise     │     │ name            │     │ id              │
├─────────────────┤     │ level           │     │ taxonomy_node_id│
│ id              │     │ parent_id       │     │ tag_id          │
│ uuid            │     │ course_id       │     └─────────────────┘
│ slug            │     │ position        │
│ title           │     │ description     │     ┌─────────────────┐
│ spec            │     │ metadata        │     │ TopicExercise   │
│ is_practice     │     └─────────────────┘     ├─────────────────┤
└─────────────────┘                             │ id              │
                                                │ taxonomy_node_id│
                                                │ exercise_id     │
                                                │ position        │
                                                └─────────────────┘
```
