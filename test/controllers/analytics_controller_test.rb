require "test_helper"

class AnalyticsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @student = create(:user, :student)
    @content_author = create(:user, :content_author)
    @instructor = create(:user, :instructor)
    @admin = create(:user, :admin)
    @exercise = create(:exercise)
  end

  # --- Index redirect tests ---

  test "should redirect index when not authenticated" do
    get analytics_path
    assert_redirected_to new_user_session_path
  end

  test "should redirect index to dashboard for student" do
    sign_in @student
    get analytics_path
    assert_redirected_to dashboard_analytics_path
  end

  test "should redirect index to dashboard for content_author" do
    sign_in @content_author
    get analytics_path
    assert_redirected_to dashboard_analytics_path
  end

  test "should redirect index to dashboard for instructor" do
    sign_in @instructor
    get analytics_path
    assert_redirected_to dashboard_analytics_path
  end

  test "should redirect index to dashboard for admin" do
    sign_in @admin
    get analytics_path
    assert_redirected_to dashboard_analytics_path
  end

  # --- Performance logs tests ---

  test "should get performance_logs for instructor" do
    sign_in @instructor
    get performance_logs_analytics_path, as: :json
    assert_response :success
  end

  test "should get performance_logs for admin" do
    sign_in @admin
    get performance_logs_analytics_path, as: :json
    assert_response :success
  end

  test "student should not access performance_logs" do
    sign_in @student
    get performance_logs_analytics_path
    assert_redirected_to dashboard_analytics_path
  end

  # --- Student dashboard tests ---

  test "student can access dashboard" do
    sign_in @student
    get dashboard_analytics_path, as: :json
    assert_response :success

    json = JSON.parse(response.body)
    assert json["summary"].is_a?(Hash)
    assert json["ledger"].is_a?(Array)
    assert json["weak_points"].is_a?(Array)
    assert json["recommendations"].is_a?(Array)
  end

  test "student can access weak_points" do
    sign_in @student
    get weak_points_analytics_path, as: :json
    assert_response :success

    json = JSON.parse(response.body)
    assert json["weak_points"].is_a?(Array)
    assert json["window_days"].is_a?(Integer)
  end

  test "student can access recommendations" do
    sign_in @student
    get recommendations_analytics_path, as: :json
    assert_response :success

    json = JSON.parse(response.body)
    assert json["recommendations"].is_a?(Array)
  end

  test "student can review own session" do
    session = create(:assessment_session, user: @student, exercise: @exercise)

    sign_in @student
    get review_analytic_path(session), as: :json
    assert_response :success

    json = JSON.parse(response.body)
    assert_equal session.id, json["session"]["id"]
    assert json["session"]["question_responses"].is_a?(Array)
  end

  test "student cannot review another student's session" do
    other_student = create(:user, :student)
    session = create(:assessment_session, user: other_student, exercise: @exercise)

    sign_in @student
    get review_analytic_path(session)
    assert_redirected_to dashboard_analytics_path
  end

  # --- Instructor/Admin aggregate tests ---

  test "instructor can access cohort metrics" do
    sign_in @instructor
    get cohort_analytics_path, as: :json
    assert_response :success

    json = JSON.parse(response.body)
    assert json["cohort"].is_a?(Hash)
  end

  test "admin can access cohort metrics" do
    sign_in @admin
    get cohort_analytics_path, as: :json
    assert_response :success
  end

  test "student cannot access cohort metrics" do
    sign_in @student
    get cohort_analytics_path
    assert_redirected_to dashboard_analytics_path
  end

  test "instructor can access tag matrix" do
    sign_in @instructor
    get tag_matrix_analytics_path, as: :json
    assert_response :success

    json = JSON.parse(response.body)
    assert json["tag_matrix"].is_a?(Array)
  end

  test "student cannot access tag matrix" do
    sign_in @student
    get tag_matrix_analytics_path
    assert_redirected_to dashboard_analytics_path
  end

  test "instructor can access item discrimination" do
    sign_in @instructor
    get item_discrimination_analytics_path, as: :json
    assert_response :success

    json = JSON.parse(response.body)
    assert json["items"].is_a?(Array)
  end

  test "student cannot access item discrimination" do
    sign_in @student
    get item_discrimination_analytics_path
    assert_redirected_to dashboard_analytics_path
  end

  # --- Authentication tests ---

  test "dashboard requires authentication" do
    get dashboard_analytics_path, as: :json
    assert_response :unauthorized
  end

  test "weak_points requires authentication" do
    get weak_points_analytics_path, as: :json
    assert_response :unauthorized
  end

  test "recommendations requires authentication" do
    get recommendations_analytics_path, as: :json
    assert_response :unauthorized
  end
end
