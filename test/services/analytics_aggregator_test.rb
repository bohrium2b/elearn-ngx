# frozen_string_literal: true

require "test_helper"

class AnalyticsAggregatorTest < ActiveSupport::TestCase
  setup do
    @user = create(:user)
    @exercise = create(:exercise)
  end

  # ============================================================================
  # Instance Methods
  # ============================================================================

  # topic_performance_matrix
  test "topic_performance_matrix returns empty array when no topics" do
    aggregator = AnalyticsAggregator.new
    assert_empty aggregator.topic_performance_matrix
  end

  test "topic_performance_matrix returns topic data" do
    topic = create(:taxonomy_node, :topic)
    create(:assessment_session, user: @user, exercise: @exercise, taxonomy_node: topic, score_percentage: 80.0)

    aggregator = AnalyticsAggregator.new
    matrix = aggregator.topic_performance_matrix

    assert_equal 1, matrix.count
    assert_equal topic.name, matrix.first[:topic_name]
    assert_equal 80.0, matrix.first[:average_score]
  end

  test "topic_performance_matrix filters by user" do
    topic = create(:taxonomy_node, :topic)
    other_user = create(:user)
    create(:assessment_session, user: @user, exercise: @exercise, taxonomy_node: topic, score_percentage: 80.0)
    create(:assessment_session, user: other_user, exercise: @exercise, taxonomy_node: topic, score_percentage: 60.0)

    aggregator = AnalyticsAggregator.new
    matrix = aggregator.topic_performance_matrix(@user)

    assert_equal 1, matrix.count
    assert_equal 80.0, matrix.first[:average_score]
  end

  test "topic_performance_matrix calculates completion rate" do
    topic = create(:taxonomy_node, :topic)
    create(:assessment_session, user: @user, exercise: @exercise, taxonomy_node: topic, score_percentage: 80.0)
    create(:assessment_session, user: @user, exercise: @exercise, taxonomy_node: topic, score_percentage: nil)

    aggregator = AnalyticsAggregator.new
    matrix = aggregator.topic_performance_matrix

    assert_equal 50.0, matrix.first[:completion_rate]
  end

  # topic_average_score
  test "topic_average_score returns nil values when no sessions" do
    topic = create(:taxonomy_node, :topic)
    aggregator = AnalyticsAggregator.new
    result = aggregator.topic_average_score(topic)

    assert_equal topic.name, result[:topic_name]
    assert_equal 0.0, result[:average_score]
    assert_equal 0, result[:total_sessions]
  end

  test "topic_average_score calculates correct average" do
    topic = create(:taxonomy_node, :topic)
    create(:assessment_session, user: @user, exercise: @exercise, taxonomy_node: topic, score_percentage: 80.0)
    create(:assessment_session, user: @user, exercise: @exercise, taxonomy_node: topic, score_percentage: 90.0)

    aggregator = AnalyticsAggregator.new
    result = aggregator.topic_average_score(topic)

    assert_equal 85.0, result[:average_score]
    assert_equal 2, result[:total_sessions]
  end

  test "topic_average_score filters by user" do
    topic = create(:taxonomy_node, :topic)
    other_user = create(:user)
    create(:assessment_session, user: @user, exercise: @exercise, taxonomy_node: topic, score_percentage: 80.0)
    create(:assessment_session, user: other_user, exercise: @exercise, taxonomy_node: topic, score_percentage: 60.0)

    aggregator = AnalyticsAggregator.new
    result = aggregator.topic_average_score(topic, @user)

    assert_equal 80.0, result[:average_score]
    assert_equal 1, result[:total_sessions]
  end

  # system_topic_performance_matrix
  test "system_topic_performance_matrix returns empty array when no topics" do
    aggregator = AnalyticsAggregator.new
    assert_empty aggregator.system_topic_performance_matrix
  end

  test "system_topic_performance_matrix includes unique users count" do
    topic = create(:taxonomy_node, :topic)
    create(:assessment_session, user: @user, exercise: @exercise, taxonomy_node: topic, score_percentage: 80.0)

    aggregator = AnalyticsAggregator.new
    matrix = aggregator.system_topic_performance_matrix

    assert_equal 1, matrix.count
    assert_equal 1, matrix.first[:unique_users]
  end

  test "system_topic_performance_matrix sorts by average score descending" do
    topic1 = create(:taxonomy_node, :topic)
    topic2 = create(:taxonomy_node, :topic)
    create(:assessment_session, user: @user, exercise: @exercise, taxonomy_node: topic1, score_percentage: 60.0)
    create(:assessment_session, user: @user, exercise: @exercise, taxonomy_node: topic2, score_percentage: 90.0)

    aggregator = AnalyticsAggregator.new
    matrix = aggregator.system_topic_performance_matrix

    assert_equal topic2.name, matrix.first[:topic_name]
    assert_equal topic1.name, matrix.last[:topic_name]
  end

  # topic_difficulty_ranking
  test "topic_difficulty_ranking returns empty array when no topics" do
    aggregator = AnalyticsAggregator.new
    assert_empty aggregator.topic_difficulty_ranking
  end

  test "topic_difficulty_ranking excludes topics with insufficient data" do
    topic = create(:taxonomy_node, :topic)
    3.times { create(:assessment_session, user: @user, exercise: @exercise, taxonomy_node: topic, score_percentage: 80.0) }

    aggregator = AnalyticsAggregator.new
    ranking = aggregator.topic_difficulty_ranking

    assert_empty ranking
  end

  test "topic_difficulty_ranking categorizes difficulty correctly" do
    topic_hard = create(:taxonomy_node, :topic)
    topic_medium = create(:taxonomy_node, :topic)
    topic_easy = create(:taxonomy_node, :topic)

    5.times { create(:assessment_session, user: @user, exercise: @exercise, taxonomy_node: topic_hard, score_percentage: 30.0) }
    5.times { create(:assessment_session, user: @user, exercise: @exercise, taxonomy_node: topic_medium, score_percentage: 55.0) }
    5.times { create(:assessment_session, user: @user, exercise: @exercise, taxonomy_node: topic_easy, score_percentage: 85.0) }

    aggregator = AnalyticsAggregator.new
    ranking = aggregator.topic_difficulty_ranking

    hard = ranking.find { |r| r[:topic_id] == topic_hard.id }
    medium = ranking.find { |r| r[:topic_id] == topic_medium.id }
    easy = ranking.find { |r| r[:topic_id] == topic_easy.id }

    assert_equal "hard", hard[:difficulty]
    assert_equal "medium", medium[:difficulty]
    assert_equal "easy", easy[:difficulty]
  end

  test "topic_difficulty_ranking sorts by average score ascending" do
    topic1 = create(:taxonomy_node, :topic)
    topic2 = create(:taxonomy_node, :topic)
    5.times { create(:assessment_session, user: @user, exercise: @exercise, taxonomy_node: topic1, score_percentage: 80.0) }
    5.times { create(:assessment_session, user: @user, exercise: @exercise, taxonomy_node: topic2, score_percentage: 50.0) }

    aggregator = AnalyticsAggregator.new
    ranking = aggregator.topic_difficulty_ranking

    assert_equal topic2.name, ranking.first[:topic_name]
    assert_equal topic1.name, ranking.last[:topic_name]
  end

  # ============================================================================
  # Class Methods
  # ============================================================================

  # cohort_metrics
  test "cohort_metrics returns correct structure" do
    metrics = AnalyticsAggregator.cohort_metrics

    assert metrics.key?(:total_sessions)
    assert metrics.key?(:unique_students)
    assert metrics.key?(:average_score)
    assert metrics.key?(:median_score)
    assert metrics.key?(:average_duration_seconds)
    assert metrics.key?(:grade_distribution)
    assert metrics.key?(:completion_trend)
  end

  test "cohort_metrics returns zeros when no sessions" do
    metrics = AnalyticsAggregator.cohort_metrics

    assert_equal 0, metrics[:total_sessions]
    assert_equal 0, metrics[:unique_students]
    assert_equal 0, metrics[:average_score]
  end

  test "cohort_metrics calculates correct values" do
    create(:assessment_session, user: @user, exercise: @exercise, score_percentage: 80.0, duration_seconds: 120)

    metrics = AnalyticsAggregator.cohort_metrics

    assert_equal 1, metrics[:total_sessions]
    assert_equal 1, metrics[:unique_students]
    assert_equal 80.0, metrics[:average_score]
  end

  test "cohort_metrics calculates grade distribution" do
    create(:assessment_session, user: @user, exercise: @exercise, score_percentage: 95.0)
    create(:assessment_session, user: @user, exercise: @exercise, score_percentage: 85.0)
    create(:assessment_session, user: @user, exercise: @exercise, score_percentage: 75.0)
    create(:assessment_session, user: @user, exercise: @exercise, score_percentage: 65.0)
    create(:assessment_session, user: @user, exercise: @exercise, score_percentage: 55.0)

    metrics = AnalyticsAggregator.cohort_metrics

    distribution = metrics[:grade_distribution]
    assert_equal 1, distribution["A (90-100)"]
    assert_equal 1, distribution["B (80-89)"]
    assert_equal 1, distribution["C (70-79)"]
    assert_equal 1, distribution["D (60-69)"]
    assert_equal 1, distribution["F (<60)"]
  end

  # tag_performance_matrix
  test "tag_performance_matrix returns empty array when no tags" do
    assert_empty AnalyticsAggregator.tag_performance_matrix
  end

  test "tag_performance_matrix returns tag hierarchy" do
    root = create(:tag)
    child = create(:tag, parent: root)

    matrix = AnalyticsAggregator.tag_performance_matrix

    assert_equal 1, matrix.count
    assert_equal root.name, matrix.first[:name]
    assert_equal 1, matrix.first[:children].count
    assert_equal child.name, matrix.first[:children].first[:name]
  end

  test "tag_performance_matrix includes average score" do
    tag = create(:tag)
    question = create(:question)
    tag.questions << question

    telemetry_data = {
      "question_responses" => [
        { "question_uuid" => question.uuid, "correct" => true },
        { "question_uuid" => question.uuid, "correct" => false }
      ]
    }
    create(:assessment_session, user: @user, exercise: @exercise, telemetry_data: telemetry_data)

    matrix = AnalyticsAggregator.tag_performance_matrix

    assert_equal 1, matrix.count
    assert_equal 50.0, matrix.first[:average_score]
  end

  # item_discrimination_metrics
  test "item_discrimination_metrics returns empty array when no sessions" do
    assert_empty AnalyticsAggregator.item_discrimination_metrics
  end

  test "item_discrimination_metrics returns question stats" do
    question = create(:question)
    telemetry_data = {
      "question_responses" => [
        { "question_uuid" => question.uuid, "correct" => true },
        { "question_uuid" => question.uuid, "correct" => false }
      ]
    }
    create(:assessment_session, user: @user, exercise: @exercise, telemetry_data: telemetry_data)

    metrics = AnalyticsAggregator.item_discrimination_metrics

    assert_equal 1, metrics.count
    assert_equal question.uuid, metrics.first[:question_uuid]
    assert_equal 2, metrics.first[:total_attempts]
    assert_equal 1, metrics.first[:correct_count]
  end

  test "item_discrimination_metrics flags questions correctly" do
    question = create(:question)
    telemetry_data = {
      "question_responses" => Array.new(10) { { "question_uuid" => question.uuid, "correct" => false } }
    }
    create(:assessment_session, user: @user, exercise: @exercise, telemetry_data: telemetry_data)

    metrics = AnalyticsAggregator.item_discrimination_metrics

    assert_equal 1, metrics.count
    assert metrics.first[:flagged]
  end

  test "item_discrimination_metrics does not flag questions with few attempts" do
    question = create(:question)
    telemetry_data = {
      "question_responses" => Array.new(3) { { "question_uuid" => question.uuid, "correct" => false } }
    }
    create(:assessment_session, user: @user, exercise: @exercise, telemetry_data: telemetry_data)

    metrics = AnalyticsAggregator.item_discrimination_metrics

    assert_equal 1, metrics.count
    assert_not metrics.first[:flagged]
  end

  # tag_average_score
  test "tag_average_score returns nil for non-existent tag" do
    assert_nil AnalyticsAggregator.tag_average_score(SecureRandom.uuid)
  end

  test "tag_average_score returns nil when no responses" do
    tag = create(:tag)
    result = AnalyticsAggregator.tag_average_score(tag.uuid)

    # Should return nil if no responses
    assert_nil result
  end

  test "tag_average_score calculates correct average" do
    tag = create(:tag)
    question = create(:question)
    tag.questions << question

    telemetry_data = {
      "question_responses" => [
        { "question_uuid" => question.uuid, "correct" => true },
        { "question_uuid" => question.uuid, "correct" => false }
      ]
    }
    create(:assessment_session, user: @user, exercise: @exercise, telemetry_data: telemetry_data)

    result = AnalyticsAggregator.tag_average_score(tag.uuid)

    assert_equal tag.name, result[:tag_name]
    assert_equal 2, result[:total_responses]
    assert_equal 1, result[:correct_count]
    assert_equal 50.0, result[:average_score]
  end

  # calculate_median
  test "calculate_median returns zero for empty sessions" do
    assert_equal 0.0, AnalyticsAggregator.calculate_median(AssessmentSession.none)
  end

  test "calculate_median calculates correct median for odd count" do
    create(:assessment_session, user: @user, exercise: @exercise, score_percentage: 70.0)
    create(:assessment_session, user: @user, exercise: @exercise, score_percentage: 80.0)
    create(:assessment_session, user: @user, exercise: @exercise, score_percentage: 90.0)

    median = AnalyticsAggregator.calculate_median(AssessmentSession.all)

    assert_equal 80.0, median
  end

  test "calculate_median calculates correct median for even count" do
    create(:assessment_session, user: @user, exercise: @exercise, score_percentage: 70.0)
    create(:assessment_session, user: @user, exercise: @exercise, score_percentage: 80.0)
    create(:assessment_session, user: @user, exercise: @exercise, score_percentage: 90.0)
    create(:assessment_session, user: @user, exercise: @exercise, score_percentage: 100.0)

    median = AnalyticsAggregator.calculate_median(AssessmentSession.all)

    assert_equal 85.0, median
  end

  # grade_distribution
  test "grade_distribution returns empty distribution when no sessions" do
    distribution = AnalyticsAggregator.grade_distribution(AssessmentSession.none)

    assert_equal 0, distribution["A (90-100)"]
    assert_equal 0, distribution["B (80-89)"]
    assert_equal 0, distribution["C (70-79)"]
    assert_equal 0, distribution["D (60-69)"]
    assert_equal 0, distribution["F (<60)"]
  end

  # completion_trend
  test "completion_trend returns empty hash when no recent sessions" do
    trend = AnalyticsAggregator.completion_trend(AssessmentSession.all)
    assert_kind_of Hash, trend
  end

  test "completion_trend groups by date" do
    create(:assessment_session, user: @user, exercise: @exercise, completed_at: Date.current)
    create(:assessment_session, user: @user, exercise: @exercise, completed_at: Date.current)

    trend = AnalyticsAggregator.completion_trend(AssessmentSession.all)

    assert_equal 2, trend[Date.current]
  end
end
