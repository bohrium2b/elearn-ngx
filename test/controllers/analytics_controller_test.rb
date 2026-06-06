require "test_helper"

class AnalyticsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @student = create(:user, :student)
    @content_author = create(:user, :content_author)
    @instructor = create(:user, :instructor)
    @admin = create(:user, :admin)
  end

  test "should redirect index when not authenticated" do
    get analytics_path
    assert_redirected_to new_user_session_path
  end

  test "should redirect index for student" do
    sign_in @student
    get analytics_path
    assert_redirected_to root_path
  end

  test "should redirect index for content_author" do
    sign_in @content_author
    get analytics_path
    assert_redirected_to root_path
  end

  test "should get index for instructor" do
    sign_in @instructor
    get analytics_path, as: :json
    assert_response :success
  end

  test "should get index for admin" do
    sign_in @admin
    get analytics_path, as: :json
    assert_response :success
  end

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
    assert_redirected_to root_path
  end
end
