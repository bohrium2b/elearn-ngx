require "test_helper"

class TagControllerTest < ActionDispatch::IntegrationTest
  setup do
    @tag = create(:tag)
    @student = create(:user, :student)
    @content_author = create(:user, :content_author)
    @instructor = create(:user, :instructor)
    @admin = create(:user, :admin)
  end

  # Public access tests
  test "should get index without authentication" do
    get tag_index_path
    assert_response :success
  end

  test "should show tag without authentication" do
    get tag_path(@tag)
    assert_response :success
  end

  # Authentication required tests
  test "should redirect new when not authenticated" do
    get new_tag_path
    assert_redirected_to new_user_session_path
  end

  test "should redirect create when not authenticated" do
    assert_no_difference("Tag.count") do
      post tag_index_path, params: { tag: { name: "New Tag" } }
    end
    assert_redirected_to new_user_session_path
  end

  # Student role tests
  test "student should not access new tag" do
    sign_in @student
    get new_tag_path
    assert_redirected_to root_path
  end

  test "student should not create tag" do
    sign_in @student
    assert_no_difference("Tag.count") do
      post tag_index_path, params: { tag: { name: "New Tag" } }
    end
    assert_redirected_to root_path
  end

  test "student should not edit tag" do
    sign_in @student
    get edit_tag_path(@tag)
    assert_redirected_to root_path
  end

  test "student should not update tag" do
    sign_in @student
    patch tag_path(@tag), params: { tag: { name: "Updated" } }
    assert_redirected_to root_path
  end

  test "student should not destroy tag" do
    sign_in @student
    assert_no_difference("Tag.count") do
      delete tag_path(@tag)
    end
    assert_redirected_to root_path
  end

  # Content author role tests
  test "content_author should access new tag" do
    sign_in @content_author
    get new_tag_path, as: :json
    assert_response :success
  end

  test "content_author should create tag" do
    sign_in @content_author
    assert_difference("Tag.count") do
      post tag_index_path, params: { tag: { name: "New Tag" } }
    end
    assert_redirected_to tag_path(Tag.last)
  end

  test "content_author should update tag" do
    sign_in @content_author
    patch tag_path(@tag), params: { tag: { name: "Updated" } }
    assert_redirected_to tag_path(@tag)
  end

  test "content_author should destroy tag" do
    sign_in @content_author
    assert_difference("Tag.count", -1) do
      delete tag_path(@tag)
    end
    # Tag destroy redirects to root_path on success
    assert_redirected_to root_path
  end

  # Admin role tests
  test "admin should access new tag" do
    sign_in @admin
    get new_tag_path, as: :json
    assert_response :success
  end

  test "admin should create tag" do
    sign_in @admin
    assert_difference("Tag.count") do
      post tag_index_path, params: { tag: { name: "Admin Tag" } }
    end
    assert_redirected_to tag_path(Tag.last)
  end
end
