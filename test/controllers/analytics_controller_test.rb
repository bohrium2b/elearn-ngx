# frozen_string_literal: true

require "test_helper"

class AnalyticsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = create(:user, :student)
    @instructor = create(:user, :instructor)
    @admin = create(:user, :admin)
    @exercise = create(:exercise)
  end

  # ============================================================================
  # Index Action
  # ============================================================================

  test "should redirect index when not authenticated" do
    get analytics_path
    assert_redirected_to new_user_session_path
  end

  test "should redirect to dashboard" do
    sign_in @user
    get analytics_path
    assert_redirected_to dashboard_analytics_path
  end

  # ============================================================================
  # Dashboard Action
  # ============================================================================

  test "should redirect dashboard when not authenticated" do
    get dashboard_analytics_path
    assert_redirected_to new_user_session_path
  end

  test "should get dashboard when authenticated" do
    sign_in @user
    get dashboard_analytics_path
    assert_response :success
  end

  test "should get dashboard as JSON" do
    sign_in @user
    get dashboard_analytics_path, as: :json
    assert_response :success

    json_response = response.parsed_body
    assert json_response.key?("summary")
    assert json_response.key?("ledger")
    assert json_response.key?("weak_points")
    assert json_response.key?("recommendations")
  end

  test "dashboard returns correct summary structure" do
    sign_in @user
    get dashboard_analytics_path, as: :json

    json_response = response.parsed_body
    summary = json_response["summary"]

    assert summary.key?("total_sessions")
    assert summary.key?("average_score")
    assert summary.key?("recent_sessions_count")
    assert summary.key?("weekly_sessions_count")
  end

  # ============================================================================
  # Review Action
  # ============================================================================

  test "should redirect review when not authenticated" do
    session = create(:assessment_session, user: @user, exercise: @exercise)
    get review_analytics_path(session)
    assert_redirected_to new_user_session_path
  end

  test "should get review for own session" do
    sign_in @user
    session = create(:assessment_session, user: @user, exercise: @exercise)
    get review_analytics_path(session)
    assert_response :success
  end

  test "should get review as JSON" do
    sign_in @user
    session = create(:assessment_session, user: @user, exercise: @exercise)
    get review_analytics_path(session), as: :json
    assert_response :success

    json_response = response.parsed_body
    assert json_response.key?("session")
  end

  test "instructor can review any session" do
    sign_in @instructor
    other_user = create(:user)
    session = create(:assessment_session, user: other_user, exercise: @exercise)
    get review_analytics_path(session)
    assert_response :success
  end

  test "admin can review any session" do
    sign_in @admin
    other_user = create(:user)
    session = create(:assessment_session, user: other_user, exercise: @exercise)
    get review_analytics_path(session)
    assert_response :success
  end

  test "student cannot review other user session" do
    sign_in @user
    other_user = create(:user)
    session = create(:assessment_session, user: other_user, exercise: @exercise)
    get review_analytics_path(session)
    assert_redirected_to dashboard_analytics_path
  end

  test "should redirect for non-existent session" do
    sign_in @user
    get review_analytics_path("non-existent")
    assert_redirected_to dashboard_analytics_path
  end

  test "review returns correct session data" do
    sign_in @user
    session = create(:assessment_session, user: @user, exercise: @exercise)
    get review_analytics_path(session), as: :json

    json_response = response.parsed_body
    session_data = json_response["session"]

    assert_equal session.uuid, session_data["uuid"]
    assert_equal @exercise.title, session_data["exercise_title"]
    assert session_data.key?("question_responses")
    assert session_data.key?("tag_registry")
  end

  # ============================================================================
  # Weak Points Action
  # ============================================================================

  test "should redirect weak_points when not authenticated" do
    get weak_points_analytics_path
    assert_redirected_to new_user_session_path
  end

  test "should get weak_points when authenticated" do
    sign_in @user
    get weak_points_analytics_path
    assert_response :success
  end

  test "should get weak_points as JSON" do
    sign_in @user
    get weak_points_analytics_path, as: :json
    assert_response :success

    json_response = response.parsed_body
    assert json_response.key?("weak_points")
    assert json_response.key?("window_days")
  end

  test "weak_points respects window parameter" do
    sign_in @user
    get weak_points_analytics_path, params: { window: 7 }, as: :json

    json_response = response.parsed_body
    assert_equal 7, json_response["window_days"]
  end

  # ============================================================================
  # Recommendations Action
  # ============================================================================

  test "should redirect recommendations when not authenticated" do
    get recommendations_analytics_path
    assert_redirected_to new_user_session_path
  end

  test "should get recommendations when authenticated" do
    sign_in @user
    get recommendations_analytics_path, as: :json
    assert_response :success
  end

  test "should get recommendations as JSON" do
    sign_in @user
    get recommendations_analytics_path, as: :json
    assert_response :success

    json_response = response.parsed_body
    assert json_response.key?("recommendations")
  end

  # ============================================================================
  # Cohort Action
  # ============================================================================

  test "should redirect cohort when not authenticated" do
    get cohort_analytics_path
    assert_redirected_to new_user_session_path
  end

  test "student should not access cohort" do
    sign_in @user
    get cohort_analytics_path
    assert_redirected_to dashboard_analytics_path
  end

  test "instructor should access cohort" do
    sign_in @instructor
    get cohort_analytics_path
    assert_response :success
  end

  test "admin should access cohort" do
    sign_in @admin
    get cohort_analytics_path
    assert_response :success
  end

  test "should get cohort as JSON" do
    sign_in @instructor
    get cohort_analytics_path, as: :json
    assert_response :success

    json_response = response.parsed_body
    assert json_response.key?("cohort")
  end

  # ============================================================================
  # Tag Matrix Action
  # ============================================================================

  test "should redirect tag_matrix when not authenticated" do
    get tag_matrix_analytics_path
    assert_redirected_to new_user_session_path
  end

  test "student should not access tag_matrix" do
    sign_in @user
    get tag_matrix_analytics_path
    assert_redirected_to dashboard_analytics_path
  end

  test "instructor should access tag_matrix" do
    sign_in @instructor
    get tag_matrix_analytics_path, as: :json
    assert_response :success
  end

  test "admin should access tag_matrix" do
    sign_in @admin
    get tag_matrix_analytics_path, as: :json
    assert_response :success
  end

  test "should get tag_matrix as JSON" do
    sign_in @instructor
    get tag_matrix_analytics_path, as: :json
    assert_response :success

    json_response = response.parsed_body
    assert json_response.key?("tag_matrix")
  end

  # ============================================================================
  # Item Discrimination Action
  # ============================================================================

  test "should redirect item_discrimination when not authenticated" do
    get item_discrimination_analytics_path
    assert_redirected_to new_user_session_path
  end

  test "student should not access item_discrimination" do
    sign_in @user
    get item_discrimination_analytics_path
    assert_redirected_to dashboard_analytics_path
  end

  test "instructor should access item_discrimination" do
    sign_in @instructor
    get item_discrimination_analytics_path, as: :json
    assert_response :success
  end

  test "admin should access item_discrimination" do
    sign_in @admin
    get item_discrimination_analytics_path, as: :json
    assert_response :success
  end

  test "should get item_discrimination as JSON" do
    sign_in @instructor
    get item_discrimination_analytics_path, as: :json
    assert_response :success

    json_response = response.parsed_body
    assert json_response.key?("items")
  end

  # ============================================================================
  # Performance Logs Action
  # ============================================================================

  test "should redirect performance_logs when not authenticated" do
    get performance_logs_analytics_path
    assert_redirected_to new_user_session_path
  end

  test "student should not access performance_logs" do
    sign_in @user
    get performance_logs_analytics_path
    assert_redirected_to dashboard_analytics_path
  end

  test "instructor should access performance_logs" do
    sign_in @instructor
    get performance_logs_analytics_path, as: :json
    assert_response :success
  end

  test "admin should access performance_logs" do
    sign_in @admin
    get performance_logs_analytics_path, as: :json
    assert_response :success
  end

  test "should get performance_logs as JSON" do
    sign_in @instructor
    get performance_logs_analytics_path, as: :json
    assert_response :success

    json_response = response.parsed_body
    assert json_response.key?("sessions")
  end

  test "performance_logs returns correct structure" do
    sign_in @instructor
    create(:assessment_session, user: @user, exercise: @exercise)
    get performance_logs_analytics_path, as: :json

    json_response = response.parsed_body
    sessions = json_response["sessions"]

    assert sessions.first.key?("uuid")
    assert sessions.first.key?("exercise_title")
    assert sessions.first.key?("score_percentage")
  end
end
