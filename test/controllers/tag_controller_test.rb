# frozen_string_literal: true

require "test_helper"

class TagControllerTest < ActionDispatch::IntegrationTest
  setup do
    @tag = create(:tag)
    @student = create(:user, :student)
    @content_author = create(:user, :content_author)
    @instructor = create(:user, :instructor)
    @admin = create(:user, :admin)
  end

  # ============================================================================
  # Index Action
  # ============================================================================

  test "should get index without authentication" do
    get tag_index_path
    assert_response :success
  end

  test "index returns JSON array" do
    get tag_index_path, as: :json
    assert_response :success
    json_response = response.parsed_body
    assert_kind_of Array, json_response
  end

  test "index returns root tags" do
    root = create(:tag)
    child = create(:tag, parent: root)

    get tag_index_path, as: :json
    json_response = response.parsed_body
    uuids = json_response.map { |t| t["uuid"] || t[:uuid] }

    assert_includes uuids, root.uuid
    assert_not_includes uuids, child.uuid
  end

  test "index returns tag tree structure" do
    root = create(:tag)
    create(:tag, parent: root)
    question = create(:question)
    root.questions << question

    get tag_index_path, as: :json
    json_response = response.parsed_body

    root_tag = json_response.find { |t| (t["uuid"] || t[:uuid]) == root.uuid }
    assert_not_nil root_tag
    assert root_tag.key?("children") || root_tag.key?(:children)
    assert root_tag.key?("questions") || root_tag.key?(:questions)
  end

  # ============================================================================
  # Show Action
  # ============================================================================

  test "should show tag without authentication" do
    get tag_path(@tag)
    assert_response :success
  end

  test "show returns tag tree" do
    get tag_path(@tag), as: :json
    assert_response :success
    json_response = response.parsed_body
    assert_equal @tag.uuid, json_response["uuid"] || json_response[:uuid]
  end

  test "show includes questions" do
    question = create(:question)
    @tag.questions << question

    get tag_path(@tag), as: :json
    json_response = response.parsed_body
    questions = json_response["questions"] || json_response[:questions]

    assert_equal 1, questions.count
  end

  test "show includes children" do
    create(:tag, parent: @tag)

    get tag_path(@tag), as: :json
    json_response = response.parsed_body
    children = json_response["children"] || json_response[:children]

    assert_equal 1, children.count
  end

  # ============================================================================
  # New Action
  # ============================================================================

  test "should redirect new when not authenticated" do
    get new_tag_path
    assert_redirected_to new_user_session_path
  end

  test "student should not access new" do
    sign_in @student
    get new_tag_path
    assert_redirected_to root_path
  end

  test "content_author should access new" do
    sign_in @content_author
    get new_tag_path, as: :json
    assert_response :success
  end

  test "admin should access new" do
    sign_in @admin
    get new_tag_path, as: :json
    assert_response :success
  end

  # ============================================================================
  # Edit Action
  # ============================================================================

  test "should redirect edit when not authenticated" do
    get edit_tag_path(@tag)
    assert_redirected_to new_user_session_path
  end

  test "student should not access edit" do
    sign_in @student
    get edit_tag_path(@tag)
    assert_redirected_to root_path
  end

  test "content_author should access edit" do
    sign_in @content_author
    get edit_tag_path(@tag), as: :json
    assert_response :success
  end

  test "admin should access edit" do
    sign_in @admin
    get edit_tag_path(@tag), as: :json
    assert_response :success
  end

  # ============================================================================
  # Create Action
  # ============================================================================

  test "should redirect create when not authenticated" do
    assert_no_difference("Tag.count") do
      post tag_index_path, params: { tag: { name: "New Tag" } }, as: :json
    end
    assert_response :unauthorized
  end

  test "student should not create tag" do
    sign_in @student
    assert_no_difference("Tag.count") do
      post tag_index_path, params: { tag: { name: "New Tag" } }, as: :json
    end
    assert_redirected_to root_path
  end

  test "content_author should create tag" do
    sign_in @content_author
    assert_difference("Tag.count") do
      post tag_index_path, params: { tag: { name: "New Tag" } }, as: :json
    end
    assert_response :created
  end

  test "admin should create tag" do
    sign_in @admin
    assert_difference("Tag.count") do
      post tag_index_path, params: { tag: { name: "Admin Tag" } }, as: :json
    end
    assert_response :created
  end

  test "should return errors for invalid tag" do
    sign_in @content_author
    assert_no_difference("Tag.count") do
      post tag_index_path, params: { tag: { name: "" } }, as: :json
    end
    assert_response :unprocessable_content
  end

  test "should create tag with parent" do
    sign_in @content_author
    parent = create(:tag)

    assert_difference("Tag.count") do
      post tag_index_path, params: { tag: { name: "Child Tag", parent_id: parent.id } }, as: :json
    end
    assert_response :created

    child = Tag.last
    assert_equal parent, child.parent
  end

  test "should create tag with custom color" do
    sign_in @content_author

    post tag_index_path, params: { tag: { name: "Colored Tag", color: "#ff0000" } }, as: :json
    assert_response :created

    tag = Tag.last
    assert_equal "#ff0000", tag.color
  end

  test "should create tag with custom slug" do
    sign_in @content_author

    post tag_index_path, params: { tag: { name: "Slug Tag", slug: "custom-slug" } }, as: :json
    assert_response :created

    tag = Tag.last
    assert_equal "tag-custom-slug", tag.slug
  end

  # ============================================================================
  # Update Action
  # ============================================================================

  test "should redirect update when not authenticated" do
    patch tag_path(@tag), params: { tag: { name: "Updated" } }, as: :json
    assert_response :unauthorized
  end

  test "student should not update tag" do
    sign_in @student
    patch tag_path(@tag), params: { tag: { name: "Updated" } }, as: :json
    assert_redirected_to root_path
  end

  test "content_author should update tag" do
    sign_in @content_author
    patch tag_path(@tag), params: { tag: { name: "Updated Name" } }, as: :json
    assert_response :success
    @tag.reload
    assert_equal "Updated Name", @tag.name
  end

  test "admin should update tag" do
    sign_in @admin
    patch tag_path(@tag), params: { tag: { name: "Admin Updated" } }, as: :json
    assert_response :success
    @tag.reload
    assert_equal "Admin Updated", @tag.name
  end

  test "should return errors for invalid update" do
    sign_in @content_author
    patch tag_path(@tag), params: { tag: { name: "" } }, as: :json
    assert_response :unprocessable_content
  end

  test "should update tag parent" do
    sign_in @content_author
    parent = create(:tag)

    patch tag_path(@tag), params: { tag: { parent_id: parent.id } }, as: :json
    assert_response :success
    @tag.reload
    assert_equal parent, @tag.parent
  end

  test "should update tag color" do
    sign_in @content_author

    patch tag_path(@tag), params: { tag: { color: "#00ff00" } }, as: :json
    assert_response :success
    @tag.reload
    assert_equal "#00ff00", @tag.color
  end

  # ============================================================================
  # Destroy Action
  # ============================================================================

  test "should redirect destroy when not authenticated" do
    assert_no_difference("Tag.count") do
      delete tag_path(@tag)
    end
    assert_redirected_to new_user_session_path
  end

  test "student should not destroy tag" do
    sign_in @student
    assert_no_difference("Tag.count") do
      delete tag_path(@tag)
    end
    assert_redirected_to root_path
  end

  test "content_author should destroy tag" do
    sign_in @content_author
    assert_difference("Tag.count", -1) do
      delete tag_path(@tag)
    end
    assert_redirected_to root_path
  end

  test "admin should destroy tag" do
    sign_in @admin
    assert_difference("Tag.count", -1) do
      delete tag_path(@tag)
    end
    assert_redirected_to root_path
  end

  test "destroy clears question associations" do
    sign_in @content_author
    question = create(:question)
    @tag.questions << question

    delete tag_path(@tag)
    question.reload
    assert_empty question.tags
  end

  test "destroy destroys child tags" do
    sign_in @content_author
    child = create(:tag, parent: @tag)

    assert_difference("Tag.count", -2) do
      delete tag_path(@tag)
    end

    assert_not Tag.exists?(child.id)
  end

  # ============================================================================
  # Find by param
  # ============================================================================

  test "should find tag by uuid" do
    get tag_path(@tag.uuid)
    assert_response :success
  end

  test "should find tag by slug" do
    get tag_path(@tag.slug)
    assert_response :success
  end

  test "should find tag by combined format" do
    param = @tag.to_param
    get tag_path(param)
    assert_response :success
  end

  test "should return 404 for non-existent tag" do
    get tag_path("non-existent")
    assert_response :not_found
  end

  # ============================================================================
  # Tag params normalization
  # ============================================================================

  test "should normalize slug by removing tag- prefix" do
    sign_in @content_author

    post tag_index_path, params: { tag: { name: "Test", slug: "tag-my-slug" } }, as: :json
    assert_response :created

    tag = Tag.last
    assert_equal "tag-my-slug", tag.slug
  end

  test "should parameterize slug" do
    sign_in @content_author

    post tag_index_path, params: { tag: { name: "Test", slug: "My Custom Slug!" } }, as: :json
    assert_response :created

    tag = Tag.last
    assert_equal "tag-my-custom-slug", tag.slug
  end
end
