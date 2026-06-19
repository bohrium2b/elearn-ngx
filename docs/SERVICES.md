# Services Documentation

## Table of Contents

- [Overview](#overview)
- [ExerciseResolver](#exerciseresolver)
- [PracticeExerciseGenerator](#practiceexercisegenerator)
- [TelemetryProcessor](#telemetryprocessor)
- [StudentAnalytics](#studentanalytics)
- [AnalyticsAggregator](#analyticsaggregator)
- [AnalyticsCacheWarmer](#analyticscachewarmer)
- [TopicAnalytics](#topicanalytics)

## Overview

Service objects in elearn-ngx encapsulate business logic that doesn't naturally fit within models or controllers. They follow the Single Responsibility Principle and are designed to be reusable across different parts of the application.

**Common Patterns:**
- Initialize with required dependencies
- Public methods for primary operations
- Private methods for internal logic
- Return structured data hashes

---

## ExerciseResolver

Resolves exercise specifications into actual questions at runtime.

### Location
`app/services/exercise_resolver.rb`

### Purpose
Takes an exercise spec containing selection rules and resolves it into a list of questions to be presented to the student.

### Usage

```ruby
spec = {
  "selection_rules" [
    { "type" => "dynamic_tag", "tag_uuid" => "uuid", "count" => 5, "strategy" => "random" },
    { "type" => "static_question", "question_uuid" => "uuid" }
  ]
}

resolver = ExerciseResolver.new(spec)
questions = resolver.resolve
```

### Public Methods

#### `resolve`
Returns an array of resolved questions based on the spec's selection rules.

**Returns:**
```ruby
[
  {
    uuid: "question-uuid",
    content: "Question text",
    options: [...],
    hints: [...],
    numChoices: 1,
    type: "multi-choice"
  }
]
```

### Selection Rule Types

#### dynamic_tag
Randomly selects N questions from a tag branch (tag + all descendants).

**Rule Structure:**
```json
{
  "type": "dynamic_tag",
  "tag_uuid": "tag-uuid",
  "count": 5,
  "strategy": "random"
}
```

#### static_question
Includes a specific question by UUID.

**Rule Structure:**
```json
{
  "type": "static_question",
  "question_uuid": "question-uuid"
}
```

### Behavior

- Prevents duplicate questions across rules
- If requested count exceeds available questions, returns all available
- Questions already selected by previous rules are excluded from subsequent rules

---

## PracticeExerciseGenerator

Generates personalized practice exercises targeting student weak areas.

### Location
`app/services/practice_exercise_generator.rb`

### Purpose
Creates practice exercises based on specific tags, specific questions, or automatically detected weak areas.

### Constants

```ruby
DEFAULT_QUESTION_COUNT = 10
```

### Usage

```ruby
generator = PracticeExerciseGenerator.new(current_user)

# Generate from specific tags
exercise = generator.generate(tag_uuids: ["uuid1", "uuid2"])

# Generate from specific questions
exercise = generator.generate(question_uuids: ["uuid1", "uuid2"])

# Generate from weak areas (auto-detect)
exercise = generator.generate

# Create and save practice exercise
exercise = generator.create_practice_exercise!(tag_uuids: ["uuid1"])
```

### Public Methods

#### `generate(tag_uuids:, question_uuids:, question_count:)`
Returns exercise data without saving to database.

**Parameters:**
- `tag_uuids` - Array of tag UUIDs (optional)
- `question_uuids` - Array of question UUIDs (optional)
- `question_count` - Number of questions (default: 10)

**Returns:**
```ruby
{
  title: "Practice: Tag1, Tag2",
  description: "This exercise targets your weak areas to help you improve.",
  questions: [...],
  spec: { "selection_rules" => [...] },
  question_count: 10
}
```

#### `create_practice_exercise!(tag_uuids:, question_uuids:, question_count:)`
Creates and saves a practice exercise to the database.

**Returns:** `Exercise` instance or `nil` if no questions found

### Question Selection Strategy

1. **If question_uuids provided:** Use those specific questions
2. **If tag_uuids provided:** Fetch questions from those tags
3. **Otherwise:** Auto-detect weak tags and fetch questions from them

### Weak Area Detection

- Collects tag scores from recent assessment sessions
- Identifies tags with at least 2 attempts and lowest success rates
- Selects up to 5 weakest tags
- Excludes already attempted questions

---

## TelemetryProcessor

Processes assessment session telemetry data and creates structured records.

### Location
`app/services/telemetryprocessor.rb`

### Purpose
Validates incoming telemetry data, calculates scores, builds registries, and creates assessment sessions.

### Usage

```ruby
processor = TelemetryProcessor.new(payload, current_user)
result = processor.process

if result[:success]
  session = AssessmentSession.new(result)
  session.save
end
```

### Public Methods

#### `process`
Validates payload and returns structured result.

**Parameters (payload):**
```ruby
{
  exercise_uuid: "uuid",
  duration_seconds: 300,
  completed_at: "2024-01-01T12:00:00Z",
  session_metadata: {},
  question_responses: [
    {
      question_uuid: "uuid",
      correct: true,
      choices_selected: ["A"],
      hints_used: 0,
      retry_count: 0,
      time_spent: 30
    }
  ]
}
```

**Returns:**
```ruby
{
  success: true,
  exercise: Exercise,
  user: User,
  score_percentage: 85.0,
  duration_seconds: 300,
  completed_at: Time,
  telemetry_data: {
    "session_metadata" => {},
    "question_responses" => [...],
    "tag_registry" => {},
    "topic_registry" => {}
  }
}
```

#### `build_topic_registry`
Builds a registry mapping questions to their associated topics.

**Returns:**
```ruby
{
  "question-uuid" => [
    {
      topic_id: 1,
      topic_name: "Topic Name",
      topic_slug: "topic-slug",
      path_identifier: "uuid-x:topic-slug"
    }
  ]
}
```

#### `process_with_topics(assessment_session)`
Enriches an existing session with topic data.

### Required Payload Keys

```ruby
REQUIRED_KEYS = %w[exercise_uuid question_responses completed_at]
QUESTION_RESPONSE_KEYS = %w[question_uuid correct]
```

### Tag Registry Structure

```json
{
  "tag-uuid": {
    "name": "Tag Name",
    "slug": "tag-slug",
    "uuid": "tag-uuid",
    "parent_id": null,
    "ancestor_path": [
      { "name": "Parent Tag", "uuid": "parent-uuid" }
    ]
  }
}
```

---

## StudentAnalytics

Provides analytics and insights for individual students.

### Location
`app/services/student_analytics.rb`

### Purpose
Generates personalized analytics including dashboard summaries, weak points, recommendations, and topic-based performance.

### Usage

```ruby
analytics = StudentAnalytics.new(current_user)

# Dashboard data
analytics.dashboard_summary
analytics.chronological_ledger
analytics.weak_points
analytics.recommendations

# Topic-based analytics
analytics.weak_points_by_topic
analytics.topic_recommendations
analytics.performance_by_topic
analytics.topic_mastery_levels
```

### Public Methods

#### `dashboard_summary`
Returns overall student performance summary.

**Returns:**
```ruby
{
  total_sessions: 50,
  average_score: 75.5,
  recent_sessions_count: 10,
  recent_average_score: 80.0,
  weekly_sessions_count: 5,
  weekly_average_score: 85.0,
  total_questions_answered: 500,
  total_correct: 375,
  current_streak: 7
}
```

#### `chronological_ledger(page:, per_page:)`
Returns paginated list of assessment sessions.

**Parameters:**
- `page` - Page number (default: 1)
- `per_page` - Items per page (default: 10)

#### `weak_points(window:)`
Returns questions with low success rates.

**Parameters:**
- `window` - Time window (default: 30.days)

**Returns:**
```ruby
[
  {
    question_uuid: "uuid",
    attempts: 5,
    correct: 1,
    success_rate: 20.0,
    last_attempt: "2024-01-01T12:00:00Z",
    tags: ["Tag1", "Tag2"]
  }
]
```

#### `recommendations(limit:)`
Returns personalized practice recommendations.

**Parameters:**
- `limit` - Number of questions (default: 5)

#### `weak_points_by_topic`
Returns topics with low average scores.

**Returns:**
```ruby
[
  {
    topic_id: 1,
    topic_name: "Topic Name",
    average_score: 55.0,
    sessions_count: 10,
    weak_area: true
  }
]
```

#### `topic_recommendations`
Returns topics needing improvement with associated exercises.

**Returns:**
```ruby
[
  {
    topic_id: 1,
    topic_name: "Topic Name",
    reason: "Low average score (55%)",
    exercises: [
      { id: 1, name: "Exercise Name" }
    ],
    questions_count: 25
  }
]
```

#### `performance_by_topic(timeframe:)`
Returns performance breakdown by topic.

**Parameters:**
- `timeframe` - Time window (default: 30.days)

#### `topic_mastery_levels`
Returns topics classified by mastery level.

**Returns:**
```ruby
[
  {
    topic_id: 1,
    topic_name: "Topic Name",
    average_score: 85.0,
    sessions_count: 10,
    mastery_level: "proficient"
  }
]
```

### Mastery Level Classification

| Score Range | Level |
|-------------|-------|
| 90-100% | mastered |
| 70-89% | proficient |
| 50-69% | developing |
| 0-49% | needs_improvement |

---

## AnalyticsAggregator

Provides system-wide analytics for instructors and administrators.

### Location
`app/services/analytics_aggregator.rb`

### Purpose
Generates aggregate analytics across all students including cohort metrics, tag performance, and item discrimination.

### Usage

```ruby
# Instance methods (topic-based)
aggregator = AnalyticsAggregator.new
aggregator.topic_performance_matrix(current_user)
aggregator.topic_average_score(topic, current_user)
aggregator.system_topic_performance_matrix
aggregator.topic_difficulty_ranking

# Class methods (system-wide)
AnalyticsAggregator.cohort_metrics
AnalyticsAggregator.tag_performance_matrix
AnalyticsAggregator.item_discrimination_metrics
AnalyticsAggregator.tag_average_score(tag_uuid)
```

### Instance Methods

#### `topic_performance_matrix(user=nil)`
Returns performance data for all topics.

**Parameters:**
- `user` - Optional user filter

**Returns:**
```ruby
[
  {
    topic_id: 1,
    topic_name: "Topic Name",
    total_sessions: 50,
    average_score: 75.5,
    completion_rate: 95.0
  }
]
```

#### `topic_average_score(topic, user=nil)`
Returns average score for a specific topic.

#### `system_topic_performance_matrix`
Returns system-wide topic metrics including unique users.

#### `topic_difficulty_ranking`
Returns topics ranked by difficulty.

**Returns:**
```ruby
[
  {
    topic_id: 1,
    topic_name: "Topic Name",
    average_score: 35.0,
    total_sessions: 20,
    difficulty: "hard"
  }
]
```

### Class Methods

#### `cohort_metrics`
Returns system-wide cohort metrics.

**Returns:**
```ruby
{
  total_sessions: 1000,
  unique_students: 150,
  average_score: 72.5,
  median_score: 75.0,
  average_duration_seconds: 300,
  grade_distribution: {
    "A (90-100)" => 100,
    "B (80-89)" => 200,
    "C (70-79)" => 300,
    "D (60-69)" => 250,
    "F (<60)" => 150
  },
  completion_trend: {
    "2024-01-01" => 50,
    "2024-01-02" => 45
  }
}
```

#### `tag_performance_matrix`
Returns hierarchical tag performance data.

#### `item_discrimination_metrics`
Returns question-level discrimination metrics.

**Returns:**
```ruby
[
  {
    question_uuid: "uuid",
    total_attempts: 100,
    correct_count: 75,
    failure_rate: 25.0,
    flagged: false
  }
]
```

#### `tag_average_score(tag_uuid)`
Returns average score for a specific tag.

### Difficulty Classification

| Average Score | Difficulty |
|---------------|------------|
| 0-39% | hard |
| 40-69% | medium |
| 70-100% | easy |

**Note:** Topics require minimum 5 sessions for difficulty ranking.

---

## AnalyticsCacheWarmer

Pre-computes and caches expensive analytics queries.

### Location
`app/services/analytics_cache_warmer.rb`

### Purpose
Background service to warm analytics caches and avoid synchronous computation during requests.

### Constants

```ruby
CACHE_TTL = 1.hour
```

### Usage

```ruby
# Warm all caches
AnalyticsCacheWarmer.warm_all

# Warm specific caches
AnalyticsCacheWarmer.warm_tag_matrix
AnalyticsCacheWarmer.warm_cohort_metrics
AnalyticsCacheWarmer.warm_item_discrimination

# Read cached data (falls back to live computation)
AnalyticsCacheWarmer.cohort_metrics
AnalyticsCacheWarmer.tag_matrix
AnalyticsCacheWarmer.item_discrimination
```

### Class Methods

#### `warm_all`
Warms all analytics caches.

#### `warm_cohort_metrics`
Pre-computes and caches cohort metrics.

#### `warm_tag_matrix`
Pre-computes and caches tag performance matrix.

#### `warm_item_discrimination`
Pre-computes and caches item discrimination metrics.

#### `cohort_metrics`
Returns cached cohort metrics (or computes if cache miss).

#### `tag_matrix`
Returns cached tag matrix (or computes if cache miss).

#### `item_discrimination`
Returns cached item discrimination (or computes if cache miss).

### Cache Keys

- `analytics/cohort_metrics`
- `analytics/tag_matrix`
- `analytics/item_discrimination`

---

## TopicAnalytics

Provides topic-based analytics (legacy service).

### Location
`app/services/topic_analytics.rb`

### Purpose
Similar to AnalyticsAggregator but focused on topic-level analytics. This service provides an alternative implementation for topic analytics.

### Usage

```ruby
analytics = TopicAnalytics.new(current_user)
analytics.topic_performance_matrix
analytics.topic_average_score(topic)
analytics.system_topic_performance_matrix
analytics.topic_difficulty_ranking
```

### Public Methods

#### `topic_performance_matrix`
Returns performance matrix for all topics.

#### `topic_average_score(topic)`
Returns average score for a specific topic.

#### `system_topic_performance_matrix`
Returns system-wide topic performance including unique users.

#### `topic_difficulty_ranking`
Returns topics ranked by difficulty.

**Note:** Topics require minimum 5 sessions for difficulty ranking.
