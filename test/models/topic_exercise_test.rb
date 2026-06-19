# frozen_string_literal: true

require "test_helper"

class TopicExerciseTest < ActiveSupport::TestCase
  # ============================================================================
  # Validations
  # ============================================================================

  test "should be valid with valid attributes" do
    topic = create(:taxonomy_node, :topic)
    exercise = create(:exercise)
    topic_exercise = build(:topic_exercise, taxonomy_node: topic, exercise: exercise)
    assert topic_exercise.valid?
  end

  test "should require unique exercise_id scoped to taxonomy_node_id" do
    topic = create(:taxonomy_node, :topic)
    exercise = create(:exercise)
    create(:topic_exercise, taxonomy_node: topic, exercise: exercise)

    duplicate = build(:topic_exercise, taxonomy_node: topic, exercise: exercise)
    assert_not duplicate.valid?
    assert_includes duplicate.errors[:exercise_id], "has already been taken"
  end

  test "should allow same exercise in different topics" do
    topic1 = create(:taxonomy_node, :topic)
    topic2 = create(:taxonomy_node, :topic)
    exercise = create(:exercise)

    create(:topic_exercise, taxonomy_node: topic1, exercise: exercise)
    topic_exercise2 = build(:topic_exercise, taxonomy_node: topic2, exercise: exercise)

    assert topic_exercise2.valid?
  end

  test "should require taxonomy_node to be a topic" do
    course = create(:taxonomy_node, :course)
    exercise = create(:exercise)
    topic_exercise = build(:topic_exercise, taxonomy_node: course, exercise: exercise)

    assert_not topic_exercise.valid?
    assert_includes topic_exercise.errors[:taxonomy_node], "must be a topic"
  end

  test "should require taxonomy_node to be a topic (part)" do
    part = create(:taxonomy_node, :part)
    exercise = create(:exercise)
    topic_exercise = build(:topic_exercise, taxonomy_node: part, exercise: exercise)

    assert_not topic_exercise.valid?
    assert_includes topic_exercise.errors[:taxonomy_node], "must be a topic"
  end

  test "should require taxonomy_node to be a topic (unit)" do
    unit = create(:taxonomy_node, :unit)
    exercise = create(:exercise)
    topic_exercise = build(:topic_exercise, taxonomy_node: unit, exercise: exercise)

    assert_not topic_exercise.valid?
    assert_includes topic_exercise.errors[:taxonomy_node], "must be a topic"
  end

  test "should accept valid topic taxonomy_node" do
    topic = create(:taxonomy_node, :topic)
    exercise = create(:exercise)
    topic_exercise = build(:topic_exercise, taxonomy_node: topic, exercise: exercise)

    assert topic_exercise.valid?
  end

  # ============================================================================
  # Associations
  # ============================================================================

  test "should belong to taxonomy_node" do
    topic = create(:taxonomy_node, :topic)
    topic_exercise = create(:topic_exercise, taxonomy_node: topic)
    assert_equal topic, topic_exercise.taxonomy_node
  end

  test "should belong to exercise" do
    exercise = create(:exercise)
    topic_exercise = create(:topic_exercise, exercise: exercise)
    assert_equal exercise, topic_exercise.exercise
  end

  # ============================================================================
  # Scopes
  # ============================================================================

  test "ordered scope orders by position" do
    topic = create(:taxonomy_node, :topic)
    exercise1 = create(:exercise)
    exercise2 = create(:exercise)

    te1 = create(:topic_exercise, taxonomy_node: topic, exercise: exercise1, position: 2)
    te2 = create(:topic_exercise, taxonomy_node: topic, exercise: exercise2, position: 1)

    ordered = TopicExercise.ordered
    assert_equal te2, ordered.first
    assert_equal te1, ordered.last
  end

  # ============================================================================
  # Edge Cases
  # ============================================================================

  test "should handle nil taxonomy_node gracefully" do
    exercise = create(:exercise)
    topic_exercise = TopicExercise.new(exercise: exercise, taxonomy_node: nil)

    # Should not raise error, just skip validation
    topic_exercise.valid?
    assert_not topic_exercise.errors[:taxonomy_node].include?("must be a topic")
  end
end
