# frozen_string_literal: true

require "test_helper"

class ExercisesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @exercise = create(:exercise)
    @student = create(:user, :student)
    @content_author = create(:user, :content_author)
    @instructor = create(:user, :instructor)
    @admin = create(:user, :admin)
  end

  # ============================================================================
  # Index Action
  # ============================================================================

  test "should get index without authentication" do
    get exercises_path
    assert_response :success
  end

  test "should get index as JSON" do
    get exercises_path, as: :json
    assert_response :success
    json_response = response.parsed_body
    assert_kind_of Array, json_response
  end

  test "index returns only regular exercises" do
    regular = create(:exercise, is_practice: false)
    practice = create(:exercise, is_practice: true)

    get exercises_path, as: :json
    json_response = response.parsed_body
    uuids = json_response.map { |e| e["uuid"] || e[:uuid] }

    assert_includes uuids, regular.uuid
    assert_not_includes uuids, practice.uuid
  end

  # ============================================================================
  # Show Action
  # ============================================================================

  test "should show exercise without authentication" do
    get exercise_path(@exercise)
    assert_response :success
  end

  test "should show exercise as JSON" do
    get exercise_path(@exercise), as: :json
    assert_response :success
  end

  # ============================================================================
  # New Action
  # ============================================================================

  test "should redirect new when not authenticated" do
    get new_exercise_path
    assert_redirected_to new_user_session_path
  end

  test "student should not access new" do
    sign_in @student
    get new_exercise_path
    assert_redirected_to root_path
  end

  test "content_author should access new" do
    sign_in @content_author
    get new_exercise_path
    assert_response :success
  end

  test "admin should access new" do
    sign_in @admin
    get new_exercise_path
    assert_response :success
  end

  # ============================================================================
  # Edit Action
  # ============================================================================

  test "should redirect edit when not authenticated" do
    get edit_exercise_path(@exercise)
    assert_redirected_to new_user_session_path
  end

  test "student should not access edit" do
    sign_in @student
    get edit_exercise_path(@exercise)
    assert_redirected_to root_path
  end

  test "content_author should access edit" do
    sign_in @content_author
    get edit_exercise_path(@exercise)
    assert_response :success
  end

  test "admin should access edit" do
    sign_in @admin
    get edit_exercise_path(@exercise)
    assert_response :success
  end

  # ============================================================================
  # Create Action
  # ============================================================================

  test "should redirect create when not authenticated" do
    assert_no_difference("Exercise.count") do
      post exercises_path, params: { exercise: { title: "Test" } }, as: :json
    end
    assert_response :unauthorized
  end

  test "student should not create exercise" do
    sign_in @student
    assert_no_difference("Exercise.count") do
      post exercises_path, params: { exercise: { title: "Test" } }, as: :json
    end
    assert_redirected_to root_path
  end

  test "content_author should create exercise" do
    sign_in @content_author
    tag = create(:tag)
    question = create(:question)
    tag.questions << question

    assert_difference("Exercise.count") do
      post exercises_path, params: {
        exercise: {
          title: "Test Exercise",
          spec: {
            selection_rules: [
              { type: "static_question", question_uuid: question.uuid }
            ]
          }
        }
      }, as: :json
    end
    assert_response :created
  end

  test "admin should create exercise" do
    sign_in @admin
    question = create(:question)

    assert_difference("Exercise.count") do
      post exercises_path, params: {
        exercise: {
          title: "Admin Exercise",
          spec: {
            selection_rules: [
              { type: "static_question", question_uuid: question.uuid }
            ]
          }
        }
      }, as: :json
    end
    assert_response :created
  end

  test "should return errors for invalid exercise" do
    sign_in @content_author
    assert_no_difference("Exercise.count") do
      post exercises_path, params: {
        exercise: { title: "", spec: nil }
      }, as: :json
    end
    assert_response :unprocessable_content
  end

  # ============================================================================
  # Update Action
  # ============================================================================

  test "should redirect update when not authenticated" do
    patch exercise_path(@exercise), params: { exercise: { title: "Updated" } }, as: :json
    assert_response :unauthorized
  end

  test "student should not update exercise" do
    sign_in @student
    patch exercise_path(@exercise), params: { exercise: { title: "Updated" } }, as: :json
    assert_redirected_to root_path
  end

  test "content_author should update exercise" do
    sign_in @content_author
    patch exercise_path(@exercise), params: { exercise: { title: "Updated Title" } }, as: :json
    assert_response :success
    @exercise.reload
    assert_equal "Updated Title", @exercise.title
  end

  test "admin should update exercise" do
    sign_in @admin
    patch exercise_path(@exercise), params: { exercise: { title: "Admin Updated" } }, as: :json
    assert_response :success
    @exercise.reload
    assert_equal "Admin Updated", @exercise.title
  end

  test "should return errors for invalid update" do
    sign_in @content_author
    patch exercise_path(@exercise), params: { exercise: { title: "" } }, as: :json
    assert_response :unprocessable_content
  end

  # ============================================================================
  # Destroy Action
  # ============================================================================

  test "should redirect destroy when not authenticated" do
    assert_no_difference("Exercise.count") do
      delete exercise_path(@exercise)
    end
    assert_redirected_to new_user_session_path
  end

  test "student should not destroy exercise" do
    sign_in @student
    assert_no_difference("Exercise.count") do
      delete exercise_path(@exercise)
    end
    assert_redirected_to root_path
  end

  test "content_author should destroy exercise" do
    sign_in @content_author
    assert_difference("Exercise.count", -1) do
      delete exercise_path(@exercise)
    end
    assert_redirected_to exercises_path
  end

  test "admin should destroy exercise" do
    sign_in @admin
    assert_difference("Exercise.count", -1) do
      delete exercise_path(@exercise)
    end
    assert_redirected_to exercises_path
  end

  # ============================================================================
  # Start Action
  # ============================================================================

  test "should start exercise without authentication" do
    get start_exercise_path(@exercise)
    assert_response :success
  end

  test "should start exercise as JSON" do
    get start_exercise_path(@exercise), as: :json
    assert_response :success
    json_response = response.parsed_body
    assert json_response.key?("title")
    assert json_response.key?("questions")
  end

  test "start returns resolved questions" do
    question = create(:question)
    exercise = create(:exercise, spec: {
                        selection_rules: [
                          { type: "static_question", question_uuid: question.uuid }
                        ]
                      })

    get start_exercise_path(exercise), as: :json
    json_response = response.parsed_body

    assert_equal 1, json_response["questions"].count
    assert_equal question.uuid, json_response["questions"].first["uuid"]
  end

  # ============================================================================
  # Practice Action
  # ============================================================================

  test "should redirect practice when no questions available" do
    get practice_exercises_path
    assert_redirected_to dashboard_analytics_path
  end

  test "should create practice exercise with tags" do
    tag = create(:tag)
    question = create(:question)
    tag.questions << question

    get practice_exercises_path, params: { tags: tag.uuid, count: 1 }
    assert_redirected_to start_exercise_path(Exercise.last)
  end

  test "should create practice exercise with questions" do
    question = create(:question)

    get practice_exercises_path, params: { questions: question.uuid, count: 1 }
    assert_redirected_to start_exercise_path(Exercise.last)
  end

  # ============================================================================
  # Find by param
  # ============================================================================

  test "should find exercise by uuid" do
    get exercise_path(@exercise.uuid)
    assert_response :success
  end

  test "should find exercise by slug" do
    get exercise_path(@exercise.slug)
    assert_response :success
  end

  test "should redirect for non-existent exercise" do
    get exercise_path("non-existent")
    assert_redirected_to exercises_path
  end
end
