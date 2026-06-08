# frozen_string_literal: true

require "test_helper"

class StudentAnalyticsTest < ActiveSupport::TestCase
  setup do
    @student = create(:user, :student)
    @exercise = create(:exercise)
    @tag = create(:tag, name: "Algebra")
    @question1 = create(:question)
    @question2 = create(:question)
    @question1.tags << @tag
    @question2.tags << @tag
  end

  test "chronological_ledger returns sessions in descending order" do
    old_session = create(:assessment_session, user: @student, exercise: @exercise, completed_at: 10.days.ago)
    new_session = create(:assessment_session, user: @student, exercise: @exercise, completed_at: 1.day.ago)

    analytics = StudentAnalytics.new(@student)
    ledger = analytics.chronological_ledger

    assert ledger.length >= 2
    # Most recent first
    assert ledger.first[:completed_at] >= ledger.last[:completed_at]
  end

  test "weak_points excludes records outside time window" do
    # Old session (outside 30-day window) with poor performance
    old_uuid = SecureRandom.uuid
    create(:assessment_session,
           user: @student,
           exercise: @exercise,
           completed_at: 60.days.ago,
           telemetry_data: {
             "question_responses" => [
               { "question_uuid" => old_uuid, "correct" => false },
               { "question_uuid" => old_uuid, "correct" => false }
             ]
           })

    # Recent session with good performance
    create(:assessment_session,
           :perfect_score,
           user: @student,
           exercise: @exercise,
           completed_at: 1.day.ago)

    analytics = StudentAnalytics.new(@student)
    weak_points = analytics.weak_points(window: 30.days)

    # Old weak point should not appear
    assert weak_points.none? { |wp| wp[:question_uuid] == old_uuid },
           "Weak points outside time window should be excluded"
  end

  test "weak_points identifies questions with low success rate" do
    # Same question attempted twice recently, both wrong
    weak_uuid = SecureRandom.uuid
    2.times do
      create(:assessment_session,
             user: @student,
             exercise: @exercise,
             completed_at: 5.days.ago,
             telemetry_data: {
               "question_responses" => [
                 { "question_uuid" => weak_uuid, "correct" => false }
               ]
             })
    end

    analytics = StudentAnalytics.new(@student)
    weak_points = analytics.weak_points(window: 30.days)

    weak = weak_points.find { |wp| wp[:question_uuid] == weak_uuid }
    assert_not_nil weak, "Question with repeated failures should appear in weak points"
    assert_equal 0.0, weak[:success_rate]
  end

  test "weak_points does not include single-attempt questions" do
    create(:assessment_session,
           user: @student,
           exercise: @exercise,
           completed_at: 1.day.ago,
           telemetry_data: {
             "question_responses" => [
               { "question_uuid" => SecureRandom.uuid, "correct" => false }
             ]
           })

    analytics = StudentAnalytics.new(@student)
    weak_points = analytics.weak_points

    # Single-attempt questions should not appear (requires > 1 attempt)
    assert(weak_points.all? { |wp| wp[:attempts] > 1 })
  end

  test "recommendations returns custom exercise for weak areas" do
    # Student performs poorly on Algebra questions
    2.times do
      create(:assessment_session,
             user: @student,
             exercise: @exercise,
             completed_at: 5.days.ago,
             telemetry_data: {
               "question_responses" => [
                 { "question_uuid" => @question1.uuid, "correct" => false }
               ]
             })
    end

    # Create an unattempted question under the same tag
    new_question = create(:question)
    new_question.tags << @tag

    analytics = StudentAnalytics.new(@student)
    recommendations = analytics.recommendations

    # Should return at least one recommendation
    assert recommendations.length > 0, "Should have at least one recommendation"

    # Recommendation should be a custom exercise
    rec = recommendations.first
    assert_equal "custom_exercise", rec[:type]
    assert rec[:title].present?
    assert rec[:exercise_path].present?
  end

  test "recommendations returns empty when no weak areas" do
    # Student has no sessions, so no weak areas
    analytics = StudentAnalytics.new(@student)
    recommendations = analytics.recommendations

    # Should return empty array when no weak areas identified
    assert_equal [], recommendations
  end

  test "dashboard_summary returns correct structure" do
    create(:assessment_session, :perfect_score, user: @student, exercise: @exercise)
    create(:assessment_session, :low_score, user: @student, exercise: @exercise)

    analytics = StudentAnalytics.new(@student)
    summary = analytics.dashboard_summary

    assert summary[:total_sessions].is_a?(Integer)
    assert summary[:average_score].is_a?(Float)
    assert summary[:total_questions_answered].is_a?(Integer)
    assert summary[:total_correct].is_a?(Integer)
    assert summary[:current_streak].is_a?(Integer)
  end

  test "question deduplication prevents skewing tag-wide performance" do
    # Student retries the same question multiple times
    same_uuid = SecureRandom.uuid
    3.times do
      create(:assessment_session,
             user: @student,
             exercise: @exercise,
             completed_at: 5.days.ago,
             telemetry_data: {
               "question_responses" => [
                 { "question_uuid" => same_uuid, "correct" => false }
               ]
             })
    end

    analytics = StudentAnalytics.new(@student)
    weak_points = analytics.weak_points

    # The question should appear only once in weak points (deduplicated by UUID)
    matching = weak_points.select { |wp| wp[:question_uuid] == same_uuid }
    assert_equal 1, matching.length,
                 "Question should appear only once (deduplicated) in weak points"
    assert_equal 3, matching.first[:attempts],
                 "Attempts should aggregate across sessions"
  end
end
