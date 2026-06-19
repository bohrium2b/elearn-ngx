# frozen_string_literal: true

require "test_helper"

class StudentAnalyticsTest < ActiveSupport::TestCase
  setup do
    @user = create(:user)
    @exercise = create(:exercise)
  end

  # ============================================================================
  # Initialization
  # ============================================================================

  test "should initialize with user" do
    analytics = StudentAnalytics.new(@user)
    assert_instance_of StudentAnalytics, analytics
  end

  # ============================================================================
  # chronological_ledger
  # ============================================================================

  test "chronological_ledger returns empty array when no sessions" do
    analytics = StudentAnalytics.new(@user)
    assert_empty analytics.chronological_ledger
  end

  test "chronological_ledger returns serialized sessions" do
    session = create(:assessment_session, user: @user, exercise: @exercise)
    analytics = StudentAnalytics.new(@user)

    ledger = analytics.chronological_ledger
    assert_equal 1, ledger.count
    assert_equal session.uuid, ledger.first[:uuid]
    assert_equal @exercise.title, ledger.first[:exercise_title]
  end

  test "chronological_ledger orders by completed_at desc" do
    old_session = create(:assessment_session, user: @user, exercise: @exercise, completed_at: 1.day.ago)
    new_session = create(:assessment_session, user: @user, exercise: @exercise, completed_at: 1.hour.ago)
    analytics = StudentAnalytics.new(@user)

    ledger = analytics.chronological_ledger
    assert_equal new_session.uuid, ledger.first[:uuid]
    assert_equal old_session.uuid, ledger.last[:uuid]
  end

  test "chronological_ledger includes correct fields" do
    create(:assessment_session, user: @user, exercise: @exercise)
    analytics = StudentAnalytics.new(@user)

    entry = analytics.chronological_ledger.first
    assert entry.key?(:id)
    assert entry.key?(:uuid)
    assert entry.key?(:exercise_id)
    assert entry.key?(:exercise_title)
    assert entry.key?(:score_percentage)
    assert entry.key?(:total_questions)
    assert entry.key?(:correct_count)
    assert entry.key?(:duration_seconds)
    assert entry.key?(:completed_at)
    assert entry.key?(:review_path)
  end

  # ============================================================================
  # total_sessions_count
  # ============================================================================

  test "total_sessions_count returns zero when no sessions" do
    analytics = StudentAnalytics.new(@user)
    assert_equal 0, analytics.total_sessions_count
  end

  test "total_sessions_count returns correct count" do
    3.times { create(:assessment_session, user: @user, exercise: @exercise) }
    analytics = StudentAnalytics.new(@user)
    assert_equal 3, analytics.total_sessions_count
  end

  # ============================================================================
  # weak_points
  # ============================================================================

  test "weak_points returns empty array when no sessions" do
    analytics = StudentAnalytics.new(@user)
    assert_empty analytics.weak_points
  end

  test "weak_points returns questions with low success rate" do
    question = create(:question)
    telemetry_data = {
      "question_responses" => [
        { "question_uuid" => question.uuid, "correct" => false },
        { "question_uuid" => question.uuid, "correct" => false },
        { "question_uuid" => question.uuid, "correct" => true }
      ]
    }
    create(:assessment_session, user: @user, exercise: @exercise, telemetry_data: telemetry_data)

    analytics = StudentAnalytics.new(@user)
    weak_points = analytics.weak_points

    # Should include question with < 50% success rate and > 1 attempt
    assert(weak_points.any? { |wp| wp[:question_uuid] == question.uuid })
  end

  test "weak_points excludes questions with only one attempt" do
    question = create(:question)
    telemetry_data = {
      "question_responses" => [
        { "question_uuid" => question.uuid, "correct" => false }
      ]
    }
    create(:assessment_session, user: @user, exercise: @exercise, telemetry_data: telemetry_data)

    analytics = StudentAnalytics.new(@user)
    weak_points = analytics.weak_points

    assert_empty weak_points
  end

  test "weak_points sorts by success rate ascending" do
    q1 = create(:question)
    q2 = create(:question)
    telemetry_data = {
      "question_responses" => [
        { "question_uuid" => q1.uuid, "correct" => false },
        { "question_uuid" => q1.uuid, "correct" => false },
        { "question_uuid" => q2.uuid, "correct" => false },
        { "question_uuid" => q2.uuid, "correct" => true }
      ]
    }
    create(:assessment_session, user: @user, exercise: @exercise, telemetry_data: telemetry_data)

    analytics = StudentAnalytics.new(@user)
    weak_points = analytics.weak_points

    assert_equal 2, weak_points.count
    assert weak_points.first[:success_rate] <= weak_points.last[:success_rate]
  end

  test "weak_points respects window parameter" do
    question = create(:question)
    telemetry_data = {
      "question_responses" => [
        { "question_uuid" => question.uuid, "correct" => false },
        { "question_uuid" => question.uuid, "correct" => false }
      ]
    }
    create(:assessment_session, user: @user, exercise: @exercise, telemetry_data: telemetry_data, completed_at: 2.months.ago)

    analytics = StudentAnalytics.new(@user)
    weak_points = analytics.weak_points(window: 30.days)

    assert_empty weak_points
  end

  # ============================================================================
  # recommendations
  # ============================================================================

  test "recommendations returns empty array when no questions available" do
    analytics = StudentAnalytics.new(@user)
    assert_empty analytics.recommendations
  end

  test "recommendations returns exercise recommendation when questions available" do
    tag = create(:tag)
    question = create(:question)
    tag.questions << question

    analytics = StudentAnalytics.new(@user)
    recommendations = analytics.recommendations

    # Should return recommendations if PracticeExerciseGenerator can create exercise
    assert_kind_of Array, recommendations
  end

  # ============================================================================
  # dashboard_summary
  # ============================================================================

  test "dashboard_summary returns correct structure" do
    analytics = StudentAnalytics.new(@user)
    summary = analytics.dashboard_summary

    assert summary.key?(:total_sessions)
    assert summary.key?(:average_score)
    assert summary.key?(:recent_sessions_count)
    assert summary.key?(:recent_average_score)
    assert summary.key?(:weekly_sessions_count)
    assert summary.key?(:weekly_average_score)
    assert summary.key?(:total_questions_answered)
    assert summary.key?(:total_correct)
    assert summary.key?(:current_streak)
  end

  test "dashboard_summary returns zeros when no sessions" do
    analytics = StudentAnalytics.new(@user)
    summary = analytics.dashboard_summary

    assert_equal 0, summary[:total_sessions]
    assert_equal 0, summary[:average_score]
    assert_equal 0, summary[:recent_sessions_count]
    assert_equal 0, summary[:weekly_sessions_count]
  end

  test "dashboard_summary calculates correct values" do
    create(:assessment_session, user: @user, exercise: @exercise, score_percentage: 80.0)
    create(:assessment_session, user: @user, exercise: @exercise, score_percentage: 90.0)

    analytics = StudentAnalytics.new(@user)
    summary = analytics.dashboard_summary

    assert_equal 2, summary[:total_sessions]
    assert_equal 85.0, summary[:average_score]
  end

  # ============================================================================
  # weak_points_by_topic
  # ============================================================================

  test "weak_points_by_topic returns empty array when no topics" do
    analytics = StudentAnalytics.new(@user)
    assert_empty analytics.weak_points_by_topic
  end

  test "weak_points_by_topic returns topic performance data" do
    topic = create(:taxonomy_node, :topic)
    create(:assessment_session, user: @user, exercise: @exercise, taxonomy_node: topic, score_percentage: 60.0)

    analytics = StudentAnalytics.new(@user)
    weak_points = analytics.weak_points_by_topic

    assert_equal 1, weak_points.count
    assert_equal topic.name, weak_points.first[:topic_name]
    assert_equal 60.0, weak_points.first[:average_score]
    assert weak_points.first[:weak_area]
  end

  test "weak_points_by_topic sorts by average score ascending" do
    topic1 = create(:taxonomy_node, :topic)
    topic2 = create(:taxonomy_node, :topic)
    create(:assessment_session, user: @user, exercise: @exercise, taxonomy_node: topic1, score_percentage: 90.0)
    create(:assessment_session, user: @user, exercise: @exercise, taxonomy_node: topic2, score_percentage: 60.0)

    analytics = StudentAnalytics.new(@user)
    weak_points = analytics.weak_points_by_topic

    assert_equal topic2.name, weak_points.first[:topic_name]
    assert_equal topic1.name, weak_points.last[:topic_name]
  end

  # ============================================================================
  # topic_recommendations
  # ============================================================================

  test "topic_recommendations returns empty array when no weak topics" do
    analytics = StudentAnalytics.new(@user)
    assert_empty analytics.topic_recommendations
  end

  test "topic_recommendations returns weak topics" do
    topic = create(:taxonomy_node, :topic)
    create(:assessment_session, user: @user, exercise: @exercise, taxonomy_node: topic, score_percentage: 50.0)

    analytics = StudentAnalytics.new(@user)
    recommendations = analytics.topic_recommendations

    assert_equal 1, recommendations.count
    assert_equal topic.name, recommendations.first[:topic_name]
    assert recommendations.first[:reason].include?("Low average score")
  end

  # ============================================================================
  # performance_by_topic
  # ============================================================================

  test "performance_by_topic returns empty array when no sessions" do
    analytics = StudentAnalytics.new(@user)
    assert_empty analytics.performance_by_topic
  end

  test "performance_by_topic returns topic performance data" do
    topic = create(:taxonomy_node, :topic)
    create(:assessment_session, user: @user, exercise: @exercise, taxonomy_node: topic, score_percentage: 75.0)

    analytics = StudentAnalytics.new(@user)
    performance = analytics.performance_by_topic

    assert_equal 1, performance.count
    assert_equal topic.name, performance.first[:topic_name]
    assert_equal 75.0, performance.first[:average_score]
  end

  test "performance_by_topic sorts by average score descending" do
    topic1 = create(:taxonomy_node, :topic)
    topic2 = create(:taxonomy_node, :topic)
    create(:assessment_session, user: @user, exercise: @exercise, taxonomy_node: topic1, score_percentage: 60.0)
    create(:assessment_session, user: @user, exercise: @exercise, taxonomy_node: topic2, score_percentage: 90.0)

    analytics = StudentAnalytics.new(@user)
    performance = analytics.performance_by_topic

    assert_equal topic2.name, performance.first[:topic_name]
    assert_equal topic1.name, performance.last[:topic_name]
  end

  # ============================================================================
  # topic_mastery_levels
  # ============================================================================

  test "topic_mastery_levels returns empty array when no topics" do
    analytics = StudentAnalytics.new(@user)
    assert_empty analytics.topic_mastery_levels
  end

  test "topic_mastery_levels returns mastery data" do
    topic = create(:taxonomy_node, :topic)
    create(:assessment_session, user: @user, exercise: @exercise, taxonomy_node: topic, score_percentage: 95.0)

    analytics = StudentAnalytics.new(@user)
    mastery = analytics.topic_mastery_levels

    assert_equal 1, mastery.count
    assert_equal topic.name, mastery.first[:topic_name]
    assert_equal "mastered", mastery.first[:mastery_level]
  end

  test "topic_mastery_levels determines correct mastery levels" do
    topic_developing = create(:taxonomy_node, :topic)
    topic_proficient = create(:taxonomy_node, :topic)
    topic_needs_improvement = create(:taxonomy_node, :topic)

    create(:assessment_session, user: @user, exercise: @exercise, taxonomy_node: topic_developing, score_percentage: 60.0)
    create(:assessment_session, user: @user, exercise: @exercise, taxonomy_node: topic_proficient, score_percentage: 80.0)
    create(:assessment_session, user: @user, exercise: @exercise, taxonomy_node: topic_needs_improvement, score_percentage: 40.0)

    analytics = StudentAnalytics.new(@user)
    mastery = analytics.topic_mastery_levels

    developing = mastery.find { |m| m[:topic_id] == topic_developing.id }
    proficient = mastery.find { |m| m[:topic_id] == topic_proficient.id }
    needs_improvement = mastery.find { |m| m[:topic_id] == topic_needs_improvement.id }

    assert_equal "developing", developing[:mastery_level]
    assert_equal "proficient", proficient[:mastery_level]
    assert_equal "needs_improvement", needs_improvement[:mastery_level]
  end

  test "topic_mastery_levels sorts by average score descending" do
    topic1 = create(:taxonomy_node, :topic)
    topic2 = create(:taxonomy_node, :topic)
    create(:assessment_session, user: @user, exercise: @exercise, taxonomy_node: topic1, score_percentage: 60.0)
    create(:assessment_session, user: @user, exercise: @exercise, taxonomy_node: topic2, score_percentage: 90.0)

    analytics = StudentAnalytics.new(@user)
    mastery = analytics.topic_mastery_levels

    assert_equal topic2.name, mastery.first[:topic_name]
    assert_equal topic1.name, mastery.last[:topic_name]
  end
end
