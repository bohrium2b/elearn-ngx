# frozen_string_literal: true

require "test_helper"

class TopicTagsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @course = TaxonomyNode.create!(name: "Test Course", level: :course)
    @part = TaxonomyNode.create!(name: "Test Part", level: :part, parent: @course, course: @course)
    @unit = TaxonomyNode.create!(name: "Test Unit", level: :unit, parent: @part, course: @course)
    @topic = TaxonomyNode.create!(name: "Test Topic", level: :topic, parent: @unit, course: @course)
    @tag = create(:tag, name: "Test Tag")
    @user = create(:user, :content_author)
    sign_in @user
  end

  test "should get index" do
    TopicTag.create!(taxonomy_node: @topic, tag: @tag)
    get topic_tags_url, params: { taxonomy_node_id: @topic.id }
    assert_response :success
    json = response.parsed_body
    assert_equal 1, json.length
  end

  test "should create topic tag" do
    assert_difference("TopicTag.count") do
      post topic_tags_url, params: {
        topic_tag: { tag_id: @tag.id },
        taxonomy_node_id: @topic.id
      }
    end
    assert_response :created
  end

  test "should destroy topic tag" do
    topic_tag = TopicTag.create!(taxonomy_node: @topic, tag: @tag)
    assert_difference("TopicTag.count", -1) do
      delete topic_tag_url(topic_tag)
    end
    assert_response :no_content
  end

  test "should return error for invalid topic tag" do
    post topic_tags_url, params: {
      topic_tag: { tag_id: nil },
      taxonomy_node_id: @topic.id
    }
    assert_response :unprocessable_entity
  end

  test "should get all topic tags when no taxonomy_node_id" do
    TopicTag.create!(taxonomy_node: @topic, tag: @tag)
    get topic_tags_url
    assert_response :success
    json = response.parsed_body
    assert json.length >= 1
  end

  test "should return tag details in serialized response" do
    TopicTag.create!(taxonomy_node: @topic, tag: @tag)
    get topic_tags_url, params: { taxonomy_node_id: @topic.id }
    assert_response :success
    json = response.parsed_body
    first_tag = json.first
    assert first_tag.key?("tag_name")
    assert first_tag.key?("tag_color")
    assert first_tag.key?("tag_slug")
    assert_equal @tag.name, first_tag["tag_name"]
  end

  test "should return empty array for topic with no tags" do
    get topic_tags_url, params: { taxonomy_node_id: @topic.id }
    assert_response :success
    json = response.parsed_body
    assert_equal [], json
  end

  test "should include taxonomy_node_id in serialized response" do
    TopicTag.create!(taxonomy_node: @topic, tag: @tag)
    get topic_tags_url, params: { taxonomy_node_id: @topic.id }
    assert_response :success
    json = response.parsed_body
    first_tag = json.first
    assert_equal @topic.id, first_tag["taxonomy_node_id"]
  end

  test "should include created_at in serialized response" do
    TopicTag.create!(taxonomy_node: @topic, tag: @tag)
    get topic_tags_url, params: { taxonomy_node_id: @topic.id }
    assert_response :success
    json = response.parsed_body
    first_tag = json.first
    assert first_tag.key?("created_at")
  end
end
