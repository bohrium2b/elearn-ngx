# frozen_string_literal: true

require "test_helper"

class AssessmentSessionTest < ActiveSupport::TestCase
  # ============================================================================
  # Validations
  # ============================================================================

  test "should be valid with valid attributes" do
    session = build(:assessment_session)
    assert session.valid?
  end

  test "should allow nil score_percentage for incomplete sessions" do
    session = build(:assessment_session, score_percentage: nil)
    assert session.valid?
  end

  test "should require score_percentage to be numeric" do
    session = build(:assessment_session, score_percentage: "not_a_number")
    assert_not session.valid?
    assert_includes session.errors[:score_percentage], "is not a number"
  end

  test "should require score_percentage >= 0" do
    session = build(:assessment_session, score_percentage: -1)
    assert_not session.valid?
    assert_includes session.errors[:score_percentage], "must be greater than or equal to 0"
  end

  test "should require score_percentage <= 100" do
    session = build(:assessment_session, score_percentage: 101)
    assert_not session.valid?
    assert_includes session.errors[:score_percentage], "must be less than or equal to 100"
  end

  test "should accept score_percentage of 0" do
    session = build(:assessment_session, score_percentage: 0)
    assert session.valid?
  end

  test "should accept score_percentage of 100" do
    session = build(:assessment_session, score_percentage: 100)
    assert session.valid?
  end

  test "should require completed_at" do
    session = build(:assessment_session, completed_at: nil)
    assert_not session.valid?
    assert_includes session.errors[:completed_at], "can't be blank"
  end

  test "should require telemetry_data" do
    session = build(:assessment_session, telemetry_data: nil)
    assert_not session.valid?
    assert_includes session.errors[:telemetry_data], "can't be blank"
  end

  test "should require uuid" do
    session = build(:assessment_session, uuid: nil)
    session.valid? # Trigger uuid generation
    assert session.uuid.present? # UUID should be auto-generated
  end

  test "should require unique uuid" do
    session1 = create(:assessment_session)
    session2 = build(:assessment_session, uuid: session1.uuid)
    assert_not session2.valid?
    assert_includes session2.errors[:uuid], "has already been taken"
  end

  # ============================================================================
  # Associations
  # ============================================================================

  test "should belong to user" do
    user = create(:user)
    session = create(:assessment_session, user: user)
    assert_equal user, session.user
  end

  test "should belong to exercise" do
    exercise = create(:exercise)
    session = create(:assessment_session, exercise: exercise)
    assert_equal exercise, session.exercise
  end

  test "should belong to taxonomy_node optionally" do
    session = create(:assessment_session, taxonomy_node: nil)
    assert_nil session.taxonomy_node

    topic = create(:taxonomy_node, :topic)
    session_with_topic = create(:assessment_session, taxonomy_node: topic)
    assert_equal topic, session_with_topic.taxonomy_node
  end

  # ============================================================================
  # Scopes
  # ============================================================================

  test "recent scope orders by completed_at desc" do
    old_session = create(:assessment_session, completed_at: 1.day.ago)
    new_session = create(:assessment_session, completed_at: 1.hour.ago)

    sessions = AssessmentSession.recent
    assert_equal new_session, sessions.first
    assert_equal old_session, sessions.last
  end

  test "for_user scope filters by user" do
    user1 = create(:user)
    user2 = create(:user)
    session1 = create(:assessment_session, user: user1)
    session2 = create(:assessment_session, user: user2)

    assert_includes AssessmentSession.for_user(user1), session1
    assert_not_includes AssessmentSession.for_user(user1), session2
  end

  test "for_exercise scope filters by exercise" do
    exercise1 = create(:exercise)
    exercise2 = create(:exercise)
    session1 = create(:assessment_session, exercise: exercise1)
    session2 = create(:assessment_session, exercise: exercise2)

    assert_includes AssessmentSession.for_exercise(exercise1), session1
    assert_not_includes AssessmentSession.for_exercise(exercise1), session2
  end

  test "completed_after scope filters by date" do
    old_session = create(:assessment_session, completed_at: 1.week.ago)
    new_session = create(:assessment_session, completed_at: 1.hour.ago)

    assert_includes AssessmentSession.completed_after(1.day.ago), new_session
    assert_not_includes AssessmentSession.completed_after(1.day.ago), old_session
  end

  test "completed_before scope filters by date" do
    old_session = create(:assessment_session, completed_at: 1.week.ago)
    new_session = create(:assessment_session, completed_at: 1.hour.ago)

    assert_includes AssessmentSession.completed_before(1.day.ago), old_session
    assert_not_includes AssessmentSession.completed_before(1.day.ago), new_session
  end

  test "in_time_window scope filters by duration" do
    old_session = create(:assessment_session, completed_at: 1.week.ago)
    new_session = create(:assessment_session, completed_at: 1.hour.ago)

    assert_includes AssessmentSession.in_time_window(1.day), new_session
    assert_not_includes AssessmentSession.in_time_window(1.day), old_session
  end

  # ============================================================================
  # Instance Methods
  # ============================================================================

  test "question_responses returns array from telemetry_data" do
    session = create(:assessment_session, telemetry_data: { "question_responses" => [{ "question_uuid" => "123" }] })
    assert_equal [{ "question_uuid" => "123" }], session.question_responses
  end

  test "question_responses returns empty array when not present" do
    session = create(:assessment_session, telemetry_data: { "question_responses" => nil })
    assert_empty session.question_responses
  end

  test "tag_registry returns hash from telemetry_data" do
    session = create(:assessment_session, telemetry_data: { "tag_registry" => { "tag1" => 5 }, "question_responses" => [] })
    assert_equal({ "tag1" => 5 }, session.tag_registry)
  end

  test "tag_registry returns empty hash when not present" do
    session = create(:assessment_session, telemetry_data: { "tag_registry" => nil, "question_responses" => [] })
    assert_equal({}, session.tag_registry)
  end

  test "session_metadata returns hash from telemetry_data" do
    session = create(:assessment_session, telemetry_data: { "session_metadata" => { "duration" => 60 }, "question_responses" => [] })
    assert_equal({ "duration" => 60 }, session.session_metadata)
  end

  test "session_metadata returns empty hash when not present" do
    session = create(:assessment_session, telemetry_data: { "session_metadata" => nil, "question_responses" => [] })
    assert_equal({}, session.session_metadata)
  end

  test "question_uuids returns unique question uuids" do
    session = create(:assessment_session, telemetry_data: {
                       "question_responses" => [
                         { "question_uuid" => "uuid1" },
                         { "question_uuid" => "uuid2" },
                         { "question_uuid" => "uuid1" }
                       ]
                     })
    assert_equal %w[uuid1 uuid2], session.question_uuids
  end

  test "question_uuids returns empty array when no responses" do
    session = create(:assessment_session, telemetry_data: { "question_responses" => [] })
    assert_empty session.question_uuids
  end

  test "correct_count returns count of correct responses" do
    session = create(:assessment_session, telemetry_data: {
                       "question_responses" => [
                         { "correct" => true },
                         { "correct" => false },
                         { "correct" => true }
                       ]
                     })
    assert_equal 2, session.correct_count
  end

  test "correct_count returns zero when no correct responses" do
    session = create(:assessment_session, telemetry_data: {
                       "question_responses" => [
                         { "correct" => false },
                         { "correct" => false }
                       ]
                     })
    assert_equal 0, session.correct_count
  end

  test "total_questions returns count of all responses" do
    session = create(:assessment_session, telemetry_data: {
                       "question_responses" => [
                         { "correct" => true },
                         { "correct" => false },
                         { "correct" => true }
                       ]
                     })
    assert_equal 3, session.total_questions
  end

  test "total_questions returns zero when no responses" do
    session = create(:assessment_session, telemetry_data: { "question_responses" => [] })
    assert_equal 0, session.total_questions
  end

  test "recalculate_score returns correct percentage" do
    session = create(:assessment_session, telemetry_data: {
                       "question_responses" => [
                         { "correct" => true },
                         { "correct" => false },
                         { "correct" => true },
                         { "correct" => true }
                       ]
                     })
    assert_equal 75.0, session.recalculate_score
  end

  test "recalculate_score returns zero when no questions" do
    session = create(:assessment_session, telemetry_data: { "question_responses" => [] })
    assert_equal 0.0, session.recalculate_score
  end

  test "recalculate_score returns 100 when all correct" do
    session = create(:assessment_session, telemetry_data: {
                       "question_responses" => [
                         { "correct" => true },
                         { "correct" => true }
                       ]
                     })
    assert_equal 100.0, session.recalculate_score
  end

  test "timed? returns true when duration_seconds is positive" do
    session = build(:assessment_session, duration_seconds: 60)
    assert session.timed?
  end

  test "timed? returns false when duration_seconds is nil" do
    session = build(:assessment_session, duration_seconds: nil)
    assert_not session.timed?
  end

  test "timed? returns false when duration_seconds is zero" do
    session = build(:assessment_session, duration_seconds: 0)
    assert_not session.timed?
  end

  test "formatted_duration returns minutes and seconds" do
    session = build(:assessment_session, duration_seconds: 125)
    assert_equal "2m 5s", session.formatted_duration
  end

  test "formatted_duration returns only seconds when less than a minute" do
    session = build(:assessment_session, duration_seconds: 45)
    assert_equal "45s", session.formatted_duration
  end

  test "formatted_duration returns N/A when not timed" do
    session = build(:assessment_session, duration_seconds: nil)
    assert_equal "N/A", session.formatted_duration
  end

  # ============================================================================
  # Class Methods
  # ============================================================================

  test "find_by_uuid_or_id finds by uuid" do
    session = create(:assessment_session)
    # rubocop:disable Rails/DynamicFindBy
    found = AssessmentSession.find_by_uuid_or_id(session.uuid)
    # rubocop:enable Rails/DynamicFindBy
    assert_equal session, found
  end

  test "find_by_uuid_or_id finds by id" do
    session = create(:assessment_session)
    # rubocop:disable Rails/DynamicFindBy
    found = AssessmentSession.find_by_uuid_or_id(session.id.to_s)
    # rubocop:enable Rails/DynamicFindBy
    assert_equal session, found
  end

  test "find_by_uuid_or_id returns nil for blank param" do
    # rubocop:disable Rails/DynamicFindBy
    assert_nil AssessmentSession.find_by_uuid_or_id("")
    assert_nil AssessmentSession.find_by_uuid_or_id(nil)
    # rubocop:enable Rails/DynamicFindBy
  end

  test "find_by_uuid_or_id returns nil for non-existent record" do
    # rubocop:disable Rails/DynamicFindBy
    assert_nil AssessmentSession.find_by_uuid_or_id("non-existent")
    # rubocop:enable Rails/DynamicFindBy
  end

  # ============================================================================
  # Callbacks
  # ============================================================================

  test "should auto-generate uuid on create" do
    session = create(:assessment_session)
    assert session.uuid.present?
    assert_match(/\A[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\z/i, session.uuid)
  end

  test "should not override existing uuid" do
    custom_uuid = SecureRandom.uuid
    session = create(:assessment_session, uuid: custom_uuid)
    assert_equal custom_uuid, session.uuid
  end
end
