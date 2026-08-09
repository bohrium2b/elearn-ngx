# frozen_string_literal: true

require "test_helper"

class ExerciseResolverTest < ActiveSupport::TestCase
  # ============================================================================
  # Initialization
  # ============================================================================

  test "should initialize with spec" do
    spec = { "selection_rules" => [] }
    resolver = ExerciseResolver.new(spec)
    assert_instance_of ExerciseResolver, resolver
  end

  # ============================================================================
  # Resolve Method
  # ============================================================================

  test "resolve returns empty array for nil spec" do
    resolver = ExerciseResolver.new(nil)
    assert_empty resolver.resolve
  end

  test "resolve returns empty array for spec without selection_rules" do
    resolver = ExerciseResolver.new({})
    assert_empty resolver.resolve
  end

  test "resolve returns empty array for non-array selection_rules" do
    resolver = ExerciseResolver.new({ "selection_rules" => "not an array" })
    assert_empty resolver.resolve
  end

  test "resolve returns empty array for empty selection_rules" do
    resolver = ExerciseResolver.new({ "selection_rules" => [] })
    assert_empty resolver.resolve
  end

  # ============================================================================
  # Dynamic Tag Rules
  # ============================================================================

  test "resolve processes dynamic_tag rule" do
    tag = create(:tag)
    question = create(:question)
    tag.questions << question

    spec = {
      "selection_rules" => [
        { "type" => "dynamic_tag", "tag_uuid" => tag.uuid, "count" => 1, "strategy" => "random" }
      ]
    }

    resolver = ExerciseResolver.new(spec)
    resolved = resolver.resolve

    assert_equal 1, resolved.count
    assert_equal question.uuid, resolved.first[:uuid]
  end

  test "resolve returns empty when tag not found for dynamic_tag" do
    spec = {
      "selection_rules" => [
        { "type" => "dynamic_tag", "tag_uuid" => SecureRandom.uuid, "count" => 1, "strategy" => "random" }
      ]
    }

    resolver = ExerciseResolver.new(spec)
    resolved = resolver.resolve

    assert_empty resolved
  end

  test "resolve samples correct number of questions" do
    tag = create(:tag)
    5.times { tag.questions << create(:question) }

    spec = {
      "selection_rules" => [
        { "type" => "dynamic_tag", "tag_uuid" => tag.uuid, "count" => 3, "strategy" => "random" }
      ]
    }

    resolver = ExerciseResolver.new(spec)
    resolved = resolver.resolve

    assert_equal 3, resolved.count
  end

  test "resolve returns all questions when count exceeds available" do
    tag = create(:tag)
    2.times { tag.questions << create(:question) }

    spec = {
      "selection_rules" => [
        { "type" => "dynamic_tag", "tag_uuid" => tag.uuid, "count" => 5, "strategy" => "random" }
      ]
    }

    resolver = ExerciseResolver.new(spec)
    resolved = resolver.resolve

    assert_equal 2, resolved.count
  end

  test "resolve includes questions from descendant tags" do
    parent = create(:tag)
    child = create(:tag, parent: parent)

    q_parent = create(:question)
    q_child = create(:question)

    parent.questions << q_parent
    child.questions << q_child

    spec = {
      "selection_rules" => [
        { "type" => "dynamic_tag", "tag_uuid" => parent.uuid, "count" => 2, "strategy" => "random" }
      ]
    }

    resolver = ExerciseResolver.new(spec)
    resolved = resolver.resolve

    assert_equal 2, resolved.count
    uuids = resolved.pluck(:uuid)
    assert_includes uuids, q_parent.uuid
    assert_includes uuids, q_child.uuid
  end

  # ============================================================================
  # Static Question Rules
  # ============================================================================

  test "resolve processes static_question rule" do
    question = create(:question)

    spec = {
      "selection_rules" => [
        { "type" => "static_question", "question_uuid" => question.uuid }
      ]
    }

    resolver = ExerciseResolver.new(spec)
    resolved = resolver.resolve

    assert_equal 1, resolved.count
    assert_equal question.uuid, resolved.first[:uuid]
  end

  test "resolve returns empty when question not found for static_question" do
    spec = {
      "selection_rules" => [
        { "type" => "static_question", "question_uuid" => SecureRandom.uuid }
      ]
    }

    resolver = ExerciseResolver.new(spec)
    resolved = resolver.resolve

    assert_empty resolved
  end

  # ============================================================================
  # Deduplication
  # ============================================================================

  test "resolve deduplicates questions from dynamic and static rules" do
    tag = create(:tag)
    question = create(:question)
    tag.questions << question

    spec = {
      "selection_rules" => [
        { "type" => "dynamic_tag", "tag_uuid" => tag.uuid, "count" => 1, "strategy" => "random" },
        { "type" => "static_question", "question_uuid" => question.uuid }
      ]
    }

    resolver = ExerciseResolver.new(spec)
    resolved = resolver.resolve

    uuids = resolved.pluck(:uuid)
    assert_equal uuids.uniq.count, uuids.count, "Questions should be unique"
  end

  test "resolve deduplicates multiple static rules for same question" do
    question = create(:question)

    spec = {
      "selection_rules" => [
        { "type" => "static_question", "question_uuid" => question.uuid },
        { "type" => "static_question", "question_uuid" => question.uuid }
      ]
    }

    resolver = ExerciseResolver.new(spec)
    resolved = resolver.resolve

    assert_equal 1, resolved.count
  end

  # ============================================================================
  # Question Data Format
  # ============================================================================

  test "resolve returns questions in correct format" do
    question = create(:question, config_data: {
                        question: "What is 2+2?",
                        choices: [{ content: "4", correct: true }, { content: "3", correct: false }],
                        hints: ["Count"],
                        numChoices: 1,
                        type: "multi-choice"
                      })

    spec = {
      "selection_rules" => [
        { "type" => "static_question", "question_uuid" => question.uuid }
      ]
    }

    resolver = ExerciseResolver.new(spec)
    resolved = resolver.resolve

    assert_equal 1, resolved.count
    result = resolved.first
    assert_equal question.uuid, result[:uuid]
    assert_equal "What is 2+2?", result[:content]
    # Options are returned as string keys from JSON
    assert_equal "4", result[:options].first["content"]
    assert_equal true, result[:options].first["correct"]
    assert_equal ["Count"], result[:hints]
    assert_equal 1, result[:numChoices]
    assert_equal "multi-choice", result[:type]
  end

  test "resolve uses defaults when config_data is missing" do
    question = create(:question, config_data: nil)

    spec = {
      "selection_rules" => [
        { "type" => "static_question", "question_uuid" => question.uuid }
      ]
    }

    resolver = ExerciseResolver.new(spec)
    resolved = resolver.resolve

    result = resolved.first
    assert_equal "Question content for #{question.uuid}", result[:content]
    assert_empty result[:options]
    assert_empty result[:hints]
    assert_equal 1, result[:numChoices]
    assert_equal "multi-choice", result[:type]
  end

  # ============================================================================
  # Multiple Rules
  # ============================================================================

  test "resolve processes multiple rules in order" do
    tag = create(:tag)
    q1 = create(:question)
    q2 = create(:question)
    tag.questions << q1

    spec = {
      "selection_rules" => [
        { "type" => "dynamic_tag", "tag_uuid" => tag.uuid, "count" => 1, "strategy" => "random" },
        { "type" => "static_question", "question_uuid" => q2.uuid }
      ]
    }

    resolver = ExerciseResolver.new(spec)
    resolved = resolver.resolve

    assert_equal 2, resolved.count
  end

  test "resolve skips unknown rule types" do
    spec = {
      "selection_rules" => [
        { "type" => "unknown_type" }
      ]
    }

    resolver = ExerciseResolver.new(spec)
    resolved = resolver.resolve

    assert_empty resolved
  end
end
