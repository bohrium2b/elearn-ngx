# frozen_string_literal: true

require "test_helper"

class PracticeExerciseGeneratorTest < ActiveSupport::TestCase
  setup do
    @user = create(:user)
  end

  # ============================================================================
  # Constants
  # ============================================================================

  test "should define DEFAULT_QUESTION_COUNT" do
    assert_equal 10, PracticeExerciseGenerator::DEFAULT_QUESTION_COUNT
  end

  # ============================================================================
  # Initialization
  # ============================================================================

  test "should initialize with user" do
    generator = PracticeExerciseGenerator.new(@user)
    assert_instance_of PracticeExerciseGenerator, generator
  end

  # ============================================================================
  # generate method
  # ============================================================================

  test "generate returns nil when no questions available" do
    generator = PracticeExerciseGenerator.new(@user)
    result = generator.generate
    assert_nil result
  end

  test "generate returns exercise data with questions from tags" do
    tag = create(:tag)
    question = create(:question)
    tag.questions << question

    generator = PracticeExerciseGenerator.new(@user)
    result = generator.generate(tag_uuids: [tag.uuid], question_count: 1)

    assert_not_nil result
    assert result[:title].include?("Practice")
    assert_equal 1, result[:questions].count
    assert_equal 1, result[:question_count]
  end

  test "generate returns exercise data with specific questions" do
    question = create(:question)

    generator = PracticeExerciseGenerator.new(@user)
    result = generator.generate(question_uuids: [question.uuid])

    assert_not_nil result
    assert_equal 1, result[:questions].count
    assert_equal question.uuid, result[:questions].first[:uuid]
  end

  test "generate excludes already attempted questions" do
    tag = create(:tag)
    question = create(:question)
    tag.questions << question

    # Create a session where user attempted this question
    telemetry_data = {
      "question_responses" => [
        { "question_uuid" => question.uuid, "correct" => true }
      ]
    }
    exercise = create(:exercise)
    create(:assessment_session, user: @user, exercise: exercise, telemetry_data: telemetry_data)

    generator = PracticeExerciseGenerator.new(@user)
    result = generator.generate(tag_uuids: [tag.uuid], question_count: 1)

    # Should return nil since question was already attempted
    assert_nil result
  end

  test "generate respects question_count parameter" do
    tag = create(:tag)
    5.times { tag.questions << create(:question) }

    generator = PracticeExerciseGenerator.new(@user)
    result = generator.generate(tag_uuids: [tag.uuid], question_count: 3)

    assert_not_nil result
    assert_equal 3, result[:questions].count
  end

  test "generate returns all available questions when count exceeds available" do
    tag = create(:tag)
    2.times { tag.questions << create(:question) }

    generator = PracticeExerciseGenerator.new(@user)
    result = generator.generate(tag_uuids: [tag.uuid], question_count: 5)

    assert_not_nil result
    assert_equal 2, result[:questions].count
  end

  test "generate returns nil for non-existent tags" do
    generator = PracticeExerciseGenerator.new(@user)
    result = generator.generate(tag_uuids: [SecureRandom.uuid])
    assert_nil result
  end

  test "generate returns nil for empty tag_uuids array" do
    generator = PracticeExerciseGenerator.new(@user)
    result = generator.generate(tag_uuids: [])
    assert_nil result
  end

  test "generate returns nil for non-existent questions" do
    generator = PracticeExerciseGenerator.new(@user)
    result = generator.generate(question_uuids: [SecureRandom.uuid])
    assert_nil result
  end

  # ============================================================================
  # create_practice_exercise! method
  # ============================================================================

  test "create_practice_exercise! returns nil when no questions available" do
    generator = PracticeExerciseGenerator.new(@user)
    result = generator.create_practice_exercise!
    assert_nil result
  end

  test "create_practice_exercise! creates exercise with correct attributes" do
    tag = create(:tag)
    question = create(:question)
    tag.questions << question

    generator = PracticeExerciseGenerator.new(@user)
    exercise = generator.create_practice_exercise!(tag_uuids: [tag.uuid], question_count: 1)

    assert_instance_of Exercise, exercise
    assert exercise.is_practice
    assert exercise.title.include?("Practice")
    assert exercise.persisted?
  end

  test "create_practice_exercise! creates exercise with correct spec" do
    question = create(:question)

    generator = PracticeExerciseGenerator.new(@user)
    exercise = generator.create_practice_exercise!(question_uuids: [question.uuid])

    assert_equal 1, exercise.spec["selection_rules"].count
    assert_equal "static_question", exercise.spec["selection_rules"].first["type"]
    assert_equal question.uuid, exercise.spec["selection_rules"].first["question_uuid"]
  end

  # ============================================================================
  # Exercise data structure
  # ============================================================================

  test "generate returns correct exercise structure" do
    question = create(:question)

    generator = PracticeExerciseGenerator.new(@user)
    result = generator.generate(question_uuids: [question.uuid])

    assert result.key?(:title)
    assert result.key?(:description)
    assert result.key?(:questions)
    assert result.key?(:spec)
    assert result.key?(:question_count)
  end

  test "generate includes tag names in title" do
    tag = create(:tag, name: "Algebra")
    question = create(:question)
    tag.questions << question

    generator = PracticeExerciseGenerator.new(@user)
    result = generator.generate(tag_uuids: [tag.uuid], question_count: 1)

    assert result[:title].include?("Algebra")
  end

  test "generate includes default title when no tags" do
    question = create(:question)

    generator = PracticeExerciseGenerator.new(@user)
    result = generator.generate(question_uuids: [question.uuid])

    assert_equal "Practice Exercise", result[:title]
  end

  test "generate includes description" do
    question = create(:question)

    generator = PracticeExerciseGenerator.new(@user)
    result = generator.generate(question_uuids: [question.uuid])

    assert_equal "This exercise targets your weak areas to help you improve.", result[:description]
  end

  # ============================================================================
  # Question data format
  # ============================================================================

  test "generate returns questions in correct format" do
    question = create(:question, config_data: {
                        "question" => "What is 2+2?",
                        "choices" => [{ "content" => "4", "correct" => true }],
                        "hints" => ["Count"],
                        "numChoices" => 1,
                        "type" => "multi-choice"
                      })

    generator = PracticeExerciseGenerator.new(@user)
    result = generator.generate(question_uuids: [question.uuid])

    q = result[:questions].first
    assert_equal question.uuid, q[:uuid]
    assert_equal "What is 2+2?", q[:content]
    assert_equal [{ "content" => "4", "correct" => true }], q[:options]
    assert_equal ["Count"], q[:hints]
    assert_equal 1, q[:numChoices]
    assert_equal "multi-choice", q[:type]
  end

  test "generate uses defaults when config_data is missing" do
    question = create(:question, config_data: nil)

    generator = PracticeExerciseGenerator.new(@user)
    result = generator.generate(question_uuids: [question.uuid])

    q = result[:questions].first
    assert_equal "Question content for #{question.uuid}", q[:content]
    assert_empty q[:options]
    assert_empty q[:hints]
    assert_equal 1, q[:numChoices]
    assert_equal "multi-choice", q[:type]
  end

  # ============================================================================
  # Spec structure
  # ============================================================================

  test "generate creates correct spec structure" do
    q1 = create(:question)
    q2 = create(:question)

    generator = PracticeExerciseGenerator.new(@user)
    result = generator.generate(question_uuids: [q1.uuid, q2.uuid])

    spec = result[:spec]
    assert spec.key?(:selection_rules)
    assert_equal 2, spec[:selection_rules].count
    assert_equal "static_question", spec[:selection_rules].first[:type]
  end

  # ============================================================================
  # Weak area questions
  # ============================================================================

  test "generate fetches weak area questions when no params provided" do
    # Without any sessions, should return nil
    generator = PracticeExerciseGenerator.new(@user)
    result = generator.generate
    assert_nil result
  end

  test "generate fetches weak area questions based on performance" do
    tag = create(:tag)
    question = create(:question)
    tag.questions << question

    # Create session with poor performance
    telemetry_data = {
      "question_responses" => [
        { "question_uuid" => question.uuid, "correct" => false },
        { "question_uuid" => question.uuid, "correct" => false }
      ]
    }
    exercise = create(:exercise)
    create(:assessment_session, user: @user, exercise: exercise, telemetry_data: telemetry_data)

    # Add another question to the tag for practice
    question2 = create(:question)
    tag.questions << question2

    generator = PracticeExerciseGenerator.new(@user)
    result = generator.generate(question_count: 1)

    # Should return exercise with weak area questions
    assert_not_nil result
  end

  # ============================================================================
  # Multiple tags
  # ============================================================================

  test "generate handles multiple tags" do
    tag1 = create(:tag)
    tag2 = create(:tag)
    q1 = create(:question)
    q2 = create(:question)
    tag1.questions << q1
    tag2.questions << q2

    generator = PracticeExerciseGenerator.new(@user)
    result = generator.generate(tag_uuids: [tag1.uuid, tag2.uuid], question_count: 2)

    assert_not_nil result
    assert_equal 2, result[:questions].count
  end

  # ============================================================================
  # Edge cases
  # ============================================================================

  test "generate handles empty question_uuids array" do
    generator = PracticeExerciseGenerator.new(@user)
    result = generator.generate(question_uuids: [])
    assert_nil result
  end

  test "generate handles nil tag_uuids" do
    generator = PracticeExerciseGenerator.new(@user)
    result = generator.generate(tag_uuids: nil)
    assert_nil result
  end

  test "generate handles nil question_uuids" do
    generator = PracticeExerciseGenerator.new(@user)
    result = generator.generate(question_uuids: nil)
    assert_nil result
  end
end
