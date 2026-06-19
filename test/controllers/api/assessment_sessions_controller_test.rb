# frozen_string_literal: true

require "test_helper"

module Api
  class AssessmentSessionsControllerTest < ActionDispatch::IntegrationTest
    setup do
      @student = create(:user, :student)
      @exercise = create(:exercise)
    end

    test "should create session with valid telemetry payload" do
      payload = {
        exercise_uuid: @exercise.uuid,
        duration_seconds: 300,
        completed_at: Time.current.iso8601,
        session_metadata: { "browser" => "Chrome" },
        question_responses: [
          { question_uuid: SecureRandom.uuid, correct: true, choices_selected: [1], hints_used: 0, retry_count: 0 },
          { question_uuid: SecureRandom.uuid, correct: false, choices_selected: [0], hints_used: 1, retry_count: 1 }
        ]
      }

      sign_in @student

      assert_difference("AssessmentSession.count", 1) do
        post api_assessment_sessions_path, params: payload, as: :json
      end

      assert_response :created
      json = response.parsed_body
      assert json["session"]["score_percentage"].is_a?(Float)
      assert_equal 2, json["session"]["total_questions"]
      assert_equal 1, json["session"]["correct_count"]
    end

    test "should return errors for invalid payload" do
      sign_in @student

      payload = {
        exercise_uuid: "non-existent-uuid",
        question_responses: []
      }

      post api_assessment_sessions_path, params: payload, as: :json

      assert_response :unprocessable_entity
      json = response.parsed_body
      assert json["errors"].is_a?(Array)
      assert json["errors"].any?
    end

    test "should require authentication" do
      post api_assessment_sessions_path, params: {}, as: :json

      assert_response :unauthorized
    end

    test "should show session details for own session" do
      session = create(:assessment_session, user: @student, exercise: @exercise)

      sign_in @student
      get api_assessment_session_path(session), as: :json

      assert_response :success
      json = response.parsed_body
      assert_equal session.id, json["session"]["id"]
      assert json["session"]["question_responses"].is_a?(Array)
    end

    test "should not show another student's session" do
      other_student = create(:user, :student)
      session = create(:assessment_session, user: other_student, exercise: @exercise)

      sign_in @student
      get api_assessment_session_path(session), as: :json

      assert_response :forbidden
    end

    test "instructor can view any session" do
      instructor = create(:user, :instructor)
      session = create(:assessment_session, user: @student, exercise: @exercise)

      sign_in instructor
      get api_assessment_session_path(session), as: :json

      assert_response :success
    end

    test "should list own sessions" do
      create(:assessment_session, user: @student, exercise: @exercise)

      sign_in @student
      get api_assessment_sessions_path, as: :json

      assert_response :success
      json = response.parsed_body
      assert json["sessions"].is_a?(Array)
      assert json["sessions"].length >= 1
    end

    test "score calculation is correct for perfect score" do
      sign_in @student

      payload = {
        exercise_uuid: @exercise.uuid,
        duration_seconds: 120,
        completed_at: Time.current.iso8601,
        question_responses: [
          { question_uuid: SecureRandom.uuid, correct: true },
          { question_uuid: SecureRandom.uuid, correct: true },
          { question_uuid: SecureRandom.uuid, correct: true }
        ]
      }

      post api_assessment_sessions_path, params: payload, as: :json

      assert_response :created
      json = response.parsed_body
      assert_equal 100.0, json["session"]["score_percentage"]
      assert_equal 3, json["session"]["correct_count"]
    end
  end
end
