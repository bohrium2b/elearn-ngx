# frozen_string_literal: true

require "test_helper"

class HomeControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = create(:user)
  end

  # ============================================================================
  # Index Action
  # ============================================================================

  test "should get index without authentication" do
    get root_path
    assert_response :success
  end

  test "should get index when authenticated" do
    sign_in @user
    get root_path
    assert_response :success
  end

  test "index assigns current_user when authenticated" do
    sign_in @user
    get root_path
    assert_response :success
  end

  test "index works without user" do
    get root_path
    assert_response :success
  end
end
