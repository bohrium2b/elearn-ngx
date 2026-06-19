# frozen_string_literal: true

require "test_helper"

class TopicExercisesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @course = TaxonomyNode.create!(name: "Test Course", level: :course)
    @part = TaxonomyNode.create!(name: "Test Part", level: :part, parent: @course, course: @course)
    @unit = TaxonomyNode.create!(name: "Test Unit", level: :unit, parent: @part, course: @course)
    @topic = TaxonomyNode.create!(name: "Test Topic", level: :topic, parent: @unit, course: @course)
    @exercise = create(:exercise, title: "Test Exercise")
  end

  test "should get index" do
    TopicExercise.create!(taxonomy_node: @topic, exercise: @exercise)
    get topic_exercises_url, params: { taxonomy_node_id: @topic.id }
    assert_response :success
    json = response.parsed_body
    assert_equal 1, json.length
  end

  test "should create topic exercise" do
    assert_difference("TopicExercise.count") do
      post topic_exercises_url, params: {
        topic_exercise: { exercise_id: @exercise.id },
        taxonomy_node_id: @topic.id
      }
    end
    assert_response :created
  end

  test "should destroy topic exercise" do
    topic_exercise = TopicExercise.create!(taxonomy_node: @topic, exercise: @exercise)
    assert_difference("TopicExercise.count", -1) do
      delete topic_exercise_url(topic_exercise)
    end
    assert_response :no_content
  end

  test "should return error for invalid topic exercise" do
    post topic_exercises_url, params: {
      topic_exercise: { exercise_id: nil },
      taxonomy_node_id: @topic.id
    }
    assert_response :unprocessable_entity
  end

  test "should get all topic exercises when no taxonomy_node_id" do
    TopicExercise.create!(taxonomy_node: @topic, exercise: @exercise)
    get topic_exercises_url
    assert_response :success
    json = response.parsed_body
    assert json.length >= 1
  end

  test "should return exercise details in serialized response" do
    TopicExercise.create!(taxonomy_node: @topic, exercise: @exercise)
    get topic_exercises_url, params: { taxonomy_node_id: @topic.id }
    assert_response :success
    json = response.parsed_body
    first_exercise = json.first
    assert first_exercise.key?("exercise_name")
    assert first_exercise.key?("exercise_slug")
    assert_equal @exercise.title, first_exercise["exercise_name"]
  end

  test "should return empty array for topic with no exercises" do
    get topic_exercises_url, params: { taxonomy_node_id: @topic.id }
    assert_response :success
    json = response.parsed_body
    assert_equal [], json
  end

  test "should include taxonomy_node_id in serialized response" do
    TopicExercise.create!(taxonomy_node: @topic, exercise: @exercise)
    get topic_exercises_url, params: { taxonomy_node_id: @topic.id }
    assert_response :success
    json = response.parsed_body
    first_exercise = json.first
    assert_equal @topic.id, first_exercise["taxonomy_node_id"]
  end

  test "should include position in serialized response" do
    TopicExercise.create!(taxonomy_node: @topic, exercise: @exercise, position: 5)
    get topic_exercises_url, params: { taxonomy_node_id: @topic.id }
    assert_response :success
    json = response.parsed_body
    first_exercise = json.first
    assert_equal 5, first_exercise["position"]
  end

  test "should order exercises by position" do
    exercise2 = create(:exercise, title: "Another Exercise")
    TopicExercise.create!(taxonomy_node: @topic, exercise: @exercise, position: 2)
    TopicExercise.create!(taxonomy_node: @topic, exercise: exercise2, position: 1)

    get topic_exercises_url, params: { taxonomy_node_id: @topic.id }
    assert_response :success
    json = response.parsed_body
    assert_equal exercise2.title, json.first["exercise_name"]
  end

  test "should include created_at in serialized response" do
    TopicExercise.create!(taxonomy_node: @topic, exercise: @exercise)
    get topic_exercises_url, params: { taxonomy_node_id: @topic.id }
    assert_response :success
    json = response.parsed_body
    first_exercise = json.first
    assert first_exercise.key?("created_at")
  end
end
