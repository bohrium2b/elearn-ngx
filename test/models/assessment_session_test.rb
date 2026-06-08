# frozen_string_literal: true

require "test_helper"

class AssessmentSessionTest < ActiveSupport::TestCase
  setup do
    @user = create(:user, :student)
    @exercise = create(:exercise)
  end

  test "valid telemetry payload saves to database and binds to correct user" do
    session = AssessmentSession.new(
      user: @user,
      exercise: @exercise,
      score_percentage: 75.0,
      duration_seconds: 300,
      completed_at: 1.hour.ago,
      telemetry_data: {
        "question_responses" => [
          { "question_uuid" => SecureRandom.uuid, "correct" => true },
          { "question_uuid" => SecureRandom.uuid, "correct" => false }
        ],
        "tag_registry" => {}
      }
    )

    assert session.save, "AssessmentSession should save with valid payload"
    assert_equal @user.id, session.user_id, "Session should be bound to the correct user"
    assert_equal @exercise.id, session.exercise_id, "Session should be bound to the correct exercise"
  end

  test "score percentage is correctly derived from question responses" do
    session = AssessmentSession.new(
      user: @user,
      exercise: @exercise,
      score_percentage: 0.0,
      completed_at: Time.current,
      telemetry_data: {
        "question_responses" => [
          { "question_uuid" => SecureRandom.uuid, "correct" => true },
          { "question_uuid" => SecureRandom.uuid, "correct" => true },
          { "question_uuid" => SecureRandom.uuid, "correct" => false },
          { "question_uuid" => SecureRandom.uuid, "correct" => false }
        ]
      }
    )

    assert_equal 50.0, session.recalculate_score
  end

  test "score percentage calculation handles all correct" do
    session = AssessmentSession.new(
      user: @user,
      exercise: @exercise,
      score_percentage: 0.0,
      completed_at: Time.current,
      telemetry_data: {
        "question_responses" => [
          { "question_uuid" => SecureRandom.uuid, "correct" => true },
          { "question_uuid" => SecureRandom.uuid, "correct" => true }
        ]
      }
    )

    assert_equal 100.0, session.recalculate_score
  end

  test "score percentage calculation handles none correct" do
    session = AssessmentSession.new(
      user: @user,
      exercise: @exercise,
      score_percentage: 0.0,
      completed_at: Time.current,
      telemetry_data: {
        "question_responses" => [
          { "question_uuid" => SecureRandom.uuid, "correct" => false },
          { "question_uuid" => SecureRandom.uuid, "correct" => false }
        ]
      }
    )

    assert_equal 0.0, session.recalculate_score
  end

  test "score percentage calculation handles empty responses" do
    session = AssessmentSession.new(
      user: @user,
      exercise: @exercise,
      score_percentage: 0.0,
      completed_at: Time.current,
      telemetry_data: {
        "question_responses" => []
      }
    )

    assert_equal 0.0, session.recalculate_score
  end

  test "is invalid without user" do
    session = AssessmentSession.new(
      exercise: @exercise,
      score_percentage: 75.0,
      completed_at: Time.current,
      telemetry_data: { "question_responses" => [] }
    )

    assert_not session.valid?
    assert_includes session.errors[:user], "must exist"
  end

  test "is invalid without exercise" do
    session = AssessmentSession.new(
      user: @user,
      score_percentage: 75.0,
      completed_at: Time.current,
      telemetry_data: { "question_responses" => [] }
    )

    assert_not session.valid?
    assert_includes session.errors[:exercise], "must exist"
  end

  test "is invalid without completed_at" do
    session = AssessmentSession.new(
      user: @user,
      exercise: @exercise,
      score_percentage: 75.0,
      telemetry_data: { "question_responses" => [] }
    )

    assert_not session.valid?
    assert_includes session.errors[:completed_at], "can't be blank"
  end

  test "is invalid with score_percentage out of range" do
    session = AssessmentSession.new(
      user: @user,
      exercise: @exercise,
      score_percentage: 150.0,
      completed_at: Time.current,
      telemetry_data: { "question_responses" => [] }
    )

    assert_not session.valid?

    session.score_percentage = -10.0
    assert_not session.valid?
  end

  test "recent scope orders by completed_at descending" do
    old_session = create(:assessment_session, user: @user, exercise: @exercise, completed_at: 10.days.ago)
    new_session = create(:assessment_session, user: @user, exercise: @exercise, completed_at: 1.day.ago)

    recent = AssessmentSession.recent
    assert_equal new_session.id, recent.first.id
    assert_equal old_session.id, recent.last.id
  end

  test "for_user scope filters by user" do
    other_user = create(:user, :student)
    user_session = create(:assessment_session, user: @user, exercise: @exercise)
    _other_session = create(:assessment_session, user: other_user, exercise: @exercise)

    assert_equal [user_session], AssessmentSession.for_user(@user).to_a
  end

  test "in_time_window scope filters by completed_at" do
    recent_session = create(:assessment_session, :recent, user: @user, exercise: @exercise)
    _old_session = create(:assessment_session, :old, user: @user, exercise: @exercise)

    sessions = AssessmentSession.in_time_window(30.days)
    assert_includes sessions, recent_session
    assert_not_includes sessions, AssessmentSession.find_by(id: recent_session.id) ? _old_session : nil
  end

  test "question_uuids returns unique UUIDs from responses" do
    uuid1 = SecureRandom.uuid
    uuid2 = SecureRandom.uuid
    session = create(:assessment_session, :low_score, user: @user, exercise: @exercise)

    uuids = session.question_uuids
    assert(uuids.all? { |u| u.is_a?(String) })
    assert_equal uuids.uniq.count, uuids.count
  end

  test "correct_count returns number of correct responses" do
    session = create(:assessment_session, :perfect_score, user: @user, exercise: @exercise)
    assert_equal session.total_questions, session.correct_count

    low_session = create(:assessment_session, :low_score, user: @user, exercise: @exercise)
    assert low_session.correct_count < low_session.total_questions
  end
end
