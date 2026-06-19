# frozen_string_literal: true

require "test_helper"

class TaxonomyNodesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @course = TaxonomyNode.create!(name: "Test Course", level: :course)
    @part = TaxonomyNode.create!(name: "Test Part", level: :part, parent: @course, course: @course)
    @unit = TaxonomyNode.create!(name: "Test Unit", level: :unit, parent: @part, course: @course)
    @topic = TaxonomyNode.create!(name: "Test Topic", level: :topic, parent: @unit, course: @course)
  end

  test "should get index" do
    get taxonomy_nodes_url
    assert_response :success
    json = response.parsed_body
    assert_equal 1, json.length
  end

  test "should show node" do
    get taxonomy_node_url(@topic)
    assert_response :success
    json = response.parsed_body
    assert_equal @topic.name, json["name"]
    assert_equal "topic", json["level"]
  end

  test "should create node" do
    assert_difference("TaxonomyNode.count") do
      post taxonomy_nodes_url, params: {
        taxonomy_node: {
          name: "New Topic",
          level: "topic",
          parent_id: @unit.id,
          course_id: @course.id
        }
      }
    end
    assert_response :created
  end

  test "should update node" do
    patch taxonomy_node_url(@topic), params: {
      taxonomy_node: { name: "Updated Topic" }
    }
    assert_response :success
    @topic.reload
    assert_equal "Updated Topic", @topic.name
  end

  test "should destroy node" do
    assert_difference("TaxonomyNode.count", -1) do
      delete taxonomy_node_url(@topic)
    end
    assert_response :no_content
  end

  test "should get descendants" do
    get descendants_taxonomy_node_url(@course)
    assert_response :success
    json = response.parsed_body
    assert_equal 3, json.length
  end

  test "should get ancestors" do
    get ancestors_taxonomy_node_url(@topic)
    assert_response :success
    json = response.parsed_body
    assert_equal 3, json.length
  end

  test "should get tree" do
    get tree_taxonomy_nodes_url
    assert_response :success
    json = response.parsed_body
    assert_equal 1, json.length
    assert_equal 1, json[0]["parts"].length
  end

  test "should get all resources" do
    get topic_all_resources_url(@topic)
    assert_response :success
    json = response.parsed_body
    assert json.key?("tags")
    assert json.key?("questions")
    assert json.key?("exercises")
  end

  test "should return error for invalid node" do
    post taxonomy_nodes_url, params: {
      taxonomy_node: { name: "", level: "topic" }
    }
    assert_response :unprocessable_entity
  end

  test "should show node by uuid" do
    get taxonomy_node_url(@topic.uuid)
    assert_response :success
    json = response.parsed_body
    assert_equal @topic.name, json["name"]
  end

  test "should show node by slug" do
    get taxonomy_node_url(@topic.slug)
    assert_response :success
    json = response.parsed_body
    assert_equal @topic.name, json["name"]
  end

  test "should return not found for invalid id" do
    get taxonomy_node_url("nonexistent-id")
    assert_response :not_found
  end

  test "should get questions for node" do
    question = create(:question)
    ContentAssignment.create!(taxonomy_node: @topic, question: question)

    get questions_taxonomy_node_url(@topic)
    assert_response :success
    json = response.parsed_body
    assert_equal 1, json.length
  end

  test "should get nodes by level" do
    get by_level_taxonomy_nodes_url(level: "topic")
    assert_response :success
    json = response.parsed_body
    assert(json.all? { |n| n["level"] == "topic" })
  end

  test "should return error for invalid level" do
    get by_level_taxonomy_nodes_url(level: "invalid")
    assert_response :bad_request
  end

  test "should include children count in serialized node" do
    get taxonomy_node_url(@course)
    assert_response :success
    json = response.parsed_body
    assert json.key?("children_count")
    assert json.key?("questions_count")
  end

  test "should include path identifier in serialized node" do
    get taxonomy_node_url(@topic)
    assert_response :success
    json = response.parsed_body
    assert_equal "#{@topic.uuid}-x:#{@topic.slug}", json["path_identifier"]
  end
end
