# Macro-Content Taxonomy & Multi-Flow Learning Pathways

## Overview

The taxonomy system provides a multi-level learning framework that organizes economics curricula into highly structured, sequential maps while maintaining reusable, modular learning objects.

## Architecture

### Content Hierarchy

```
[COURSE] Highest conceptual container (e.g., "Macroeconomics 101")
   └── [PART] Broad domain groupings (e.g., "Part 1: Monetary Policy")
         └── [UNIT] Targeted learning milestones (e.g., "Unit 3: Central Banking Mechanics")
               └── [TOPIC] Smallest educational atomic unit (e.g., "The Reserve Ratio")
```

### Identity System

Every node uses a UUID + slug identity system:
- Format: `/:uuid-x::slug_name`
- Slugs have type prefixes: `course-`, `part-`, `unit-`, `topic-`
- Example: `/taxonomy/a8c3d11b-58cc-4372-a567-0e02b2c3d479-x:topic-opportunity-cost`

## Database Schema

### taxonomy_nodes table
- `name`: Node name
- `slug`: URL-friendly identifier with type prefix
- `uuid`: Unique identifier for public-facing URLs
- `level`: Enum (course: 0, part: 1, unit: 2, topic: 3)
- `parent_id`: Self-referential foreign key for hierarchy
- `course_id`: Reference to the root course
- `position`: Ordering within siblings
- `metadata`: JSONB for flexible data
- `description`: Text description

### topic_tags table
- Join table for many-to-many relationship between topics and tags
- Unique index on [taxonomy_node_id, tag_id]

### topic_exercises table
- Join table for many-to-many relationship between topics and exercises
- Includes `position` for ordering

### content_assignments table
- Join table for questions assigned to topics

## Models

### TaxonomyNode
- Has self-referential hierarchy (parent/children)
- Belongs to a course (root node)
- Has many tags through topic_tags
- Has many exercises through topic_exercises
- Has many questions through content_assignments
- Validates slug prefix matches level
- Prevents circular references
- Enforces intra-course topic uniqueness

### TopicTag
- Joins TaxonomyNode and Tag
- Validates taxonomy_node is a topic level
- Enforces unique tag per topic

### TopicExercise
- Joins TaxonomyNode and Exercise
- Validates taxonomy_node is a topic level
- Enforces unique exercise per topic
- Orders by position

## API Endpoints

### Taxonomy Nodes
- `GET /taxonomy` - List all root nodes (courses)
- `GET /taxonomy/:id` - Show a node
- `POST /taxonomy` - Create a node
- `PATCH /taxonomy/:id` - Update a node
- `DELETE /taxonomy/:id` - Delete a node
- `GET /taxonomy/:id/descendants` - Get all descendants
- `GET /taxonomy/:id/ancestors` - Get all ancestors
- `GET /taxonomy/:id/questions` - Get questions for a node
- `GET /taxonomy/:id/all_resources` - Get all resources (tags, questions, exercises)
- `GET /taxonomy/tree` - Get full tree structure
- `GET /taxonomy/by_level?level=:level` - Get nodes by level

### Topic Tags
- `GET /topic_tags?taxonomy_node_id=:id` - List tags for a topic
- `POST /topic_tags` - Attach tag to topic
- `DELETE /topic_tags/:id` - Detach tag from topic

### Topic Exercises
- `GET /topic_exercises?taxonomy_node_id=:id` - List exercises for a topic
- `POST /topic_exercises` - Attach exercise to topic
- `DELETE /topic_exercises/:id` - Detach exercise from topic

### Analytics
- `GET /api/analytics/topic_matrix` - System-wide topic performance matrix
- `GET /api/analytics/topic_performance/:id` - Performance for a specific topic
- `GET /api/analytics/weak_points_by_topic` - Topic-based weak points
- `GET /api/analytics/topic_recommendations` - Topic-based recommendations

## Frontend Components

### Islands (Web Components)
- `<course-library>` - Hierarchical browser for courses
- `<course-pathway>` - Gamified linear pathway view
- `<course-assembler>` - Admin drag-and-drop dashboard

### Student Views
- Linear Pathway Flow - Gamified vertical scrolling path
- Library Browser - Folder-tree interface

### Admin Views
- Course Assembler Dashboard - Split-pane layout with inventory, canvas, and preview

## Analytics Integration

### TelemetryProcessor
- Builds topic registry from question tags and content assignments
- Calculates per-topic performance metrics
- Enriches telemetry data with topic associations

### StudentAnalytics
- `weak_points_by_topic` - Identifies topics with low scores
- `topic_recommendations` - Recommends topics for improvement
- `performance_by_topic` - Performance breakdown by topic
- `topic_mastery_levels` - Mastery classification (mastered, proficient, developing, needs_improvement)

### AnalyticsAggregator
- `topic_performance_matrix` - System-wide performance data
- `topic_difficulty_ranking` - Ranks topics by difficulty
- `system_topic_performance_matrix` - Includes unique users and completion rates

## Usage Examples

### Creating a Course Structure
```ruby
course = TaxonomyNode.create!(name: "Macroeconomics 101", level: :course)
part = TaxonomyNode.create!(name: "Part 1: Monetary Policy", level: :part, parent: course, course: course)
unit = TaxonomyNode.create!(name: "Unit 1: Central Banking", level: :unit, parent: part, course: course)
topic = TaxonomyNode.create!(name: "Reserve Requirements", level: :topic, parent: unit, course: course)
```

### Attaching Resources to a Topic
```ruby
# Attach a tag
TopicTag.create!(taxonomy_node: topic, tag: Tag.find_by(name: "Banking"))

# Attach an exercise
TopicExercise.create!(taxonomy_node: topic, exercise: Exercise.find_by(name: "Reserve Ratio Practice"))

# Assign a question
ContentAssignment.create!(taxonomy_node: topic, question: Question.first)
```

### Finding Topics
```ruby
# By UUID
TaxonomyNode.find_by_param("a8c3d11b-58cc-4372-a567-0e02b2c3d479")

# By slug
TaxonomyNode.find_by_param("topic-reserve-requirements")

# By ID
TaxonomyNode.find_by_param("42")
```

## Testing

Run the test suite:
```bash
rails test test/models/taxonomy_node_test.rb
rails test test/models/topic_tag_test.rb
rails test test/models/topic_exercise_test.rb
rails test test/controllers/taxonomy_nodes_controller_test.rb
rails test test/controllers/topic_tags_controller_test.rb
rails test test/controllers/topic_exercises_controller_test.rb
rails test test/services/student_analytics_test.rb
rails test test/services/analytics_aggregator_test.rb
```

## Performance Considerations

- Database indexes on uuid, slug, parent_id, course_id, and level
- Eager loading for tree operations
- CTE queries for recursive tree traversal
- Caching for frequently accessed paths

## Topic Resources & Analytics Extension

### Overview

The Topic Resources & Analytics extension adds comprehensive resource management and analytics capabilities to the taxonomy system, enabling detailed tracking of student performance at the topic level.

### Key Features

1. **Topic-Resource Associations**
   - Topics can have multiple tags, exercises, and questions
   - Resources are ordered and manageable through dedicated controllers

2. **Topic-Based Analytics**
   - Student performance tracking by topic
   - Weak point identification
   - Personalized topic recommendations
   - Mastery level classification

3. **System-Wide Analytics**
   - Topic performance matrices
   - Difficulty rankings
   - Completion rate tracking

### Analytics Methods

#### StudentAnalytics (Instance Methods)

| Method | Description |
|--------|-------------|
| `weak_points_by_topic` | Returns topics with average scores below 70% |
| `topic_recommendations` | Recommends topics needing improvement with associated exercises |
| `performance_by_topic` | Performance breakdown by topic with timeframe filtering |
| `topic_mastery_levels` | Classifies topics by mastery level |

#### AnalyticsAggregator (Instance Methods)

| Method | Description |
|--------|-------------|
| `topic_performance_matrix(user=nil)` | Performance matrix for all topics, optionally filtered by user |
| `topic_average_score(topic, user=nil)` | Average score for a specific topic |
| `system_topic_performance_matrix` | System-wide metrics including unique users and completion rates |
| `topic_difficulty_ranking` | Ranks topics by difficulty (hard/medium/easy) |

### Mastery Level Classification

| Score Range | Level |
|-------------|-------|
| 90-100% | mastered |
| 70-89% | proficient |
| 50-69% | developing |
| 0-49% | needs_improvement |

### Difficulty Classification

| Average Score | Difficulty |
|---------------|------------|
| 0-39% | hard |
| 40-69% | medium |
| 70-100% | easy |

Note: Topics require a minimum of 5 sessions to be included in difficulty rankings for statistical significance.
