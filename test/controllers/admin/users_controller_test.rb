require "test_helper"

class Admin::UsersControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = create(:user, :student)
    @admin = create(:user, :admin)
    @content_author = create(:user, :content_author)
  end

  test "should redirect index when not authenticated" do
    get admin_users_path
    assert_redirected_to new_user_session_path
  end

  test "should redirect index for non-admin" do
    sign_in @content_author
    get admin_users_path
    assert_redirected_to root_path
  end

  test "should get index for admin" do
    sign_in @admin
    get admin_users_path, as: :json
    assert_response :success
  end

  test "should show user for admin" do
    sign_in @admin
    get admin_user_path(@user), as: :json
    assert_response :success
  end

  test "should edit user for admin" do
    sign_in @admin
    get edit_admin_user_path(@user), as: :json
    assert_response :success
  end

  test "should update user for admin" do
    sign_in @admin
    patch admin_user_path(@user), params: { user: { username: "updated" } }
    assert_redirected_to admin_user_path(@user)
    @user.reload
    assert_equal "updated", @user.username
  end

  test "should destroy user for admin" do
    sign_in @admin
    assert_difference("User.count", -1) do
      delete admin_user_path(@user)
    end
    assert_redirected_to admin_users_path
  end

  test "non-admin should not destroy user" do
    sign_in @content_author
    assert_no_difference("User.count") do
      delete admin_user_path(@user)
    end
    assert_redirected_to root_path
  end
end
