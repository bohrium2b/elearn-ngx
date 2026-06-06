require "test_helper"

class QuestionsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @question = create(:question)
    @student = create(:user, :student)
    @content_author = create(:user, :content_author)
    @instructor = create(:user, :instructor)
    @admin = create(:user, :admin)
  end

  # Public access tests
  test "should get index without authentication" do
    get questions_path
    assert_response :success
  end

  test "should show question without authentication" do
    get question_path(@question)
    assert_response :success
  end

  # Authentication required tests
  test "should redirect new when not authenticated" do
    get new_question_path
    assert_redirected_to new_user_session_path
  end

  test "should redirect create when not authenticated" do
    assert_no_difference("Question.count") do
      post questions_path, params: { question: { config_data: "{}" } }, as: :json
    end
    assert_response :unauthorized
  end

  test "should redirect edit when not authenticated" do
    get edit_question_path(@question)
    assert_redirected_to new_user_session_path
  end

  test "should redirect update when not authenticated" do
    patch question_path(@question), params: { question: { config_data: "{}" } }, as: :json
    assert_response :unauthorized
  end

  test "should redirect destroy when not authenticated" do
    assert_no_difference("Question.count") do
      delete question_path(@question), as: :json
    end
    assert_response :unauthorized
  end

  # Student role tests
  test "student should not access new" do
    sign_in @student
    get new_question_path
    assert_redirected_to root_path
  end

  test "student should not create question" do
    sign_in @student
    assert_no_difference("Question.count") do
      post questions_path, params: { question: { config_data: "{}" } }, as: :json
    end
    assert_redirected_to root_path
  end

  test "student should not edit question" do
    sign_in @student
    get edit_question_path(@question)
    assert_redirected_to root_path
  end

  test "student should not update question" do
    sign_in @student
    patch question_path(@question), params: { question: { config_data: "{}" } }, as: :json
    assert_redirected_to root_path
  end

  test "student should not destroy question" do
    sign_in @student
    assert_no_difference("Question.count") do
      delete question_path(@question), as: :json
    end
    assert_redirected_to root_path
  end

  # Content author role tests
  test "content_author should access new" do
    sign_in @content_author
    get new_question_path
    assert_response :success
  end

  test "content_author should create question with valid data" do
    sign_in @content_author
    assert_difference("Question.count") do
      post questions_path, params: {
        question: "What is the capital of France? This is a longer question text.",
        slug: "capital-france",
        numChoices: 1,
        choices: [
          { content: "Paris", correct: true },
          { content: "London", correct: false }
        ],
        hints: ["Think about France"]
      }, as: :json
    end
    assert_response :ok
  end

  test "content_author should edit question" do
    sign_in @content_author
    get edit_question_path(@question)
    assert_response :success
  end

  test "content_author should update question with valid data" do
    sign_in @content_author
    patch question_path(@question), params: {
      question: "What is the updated question text? This is longer.",
      slug: "updated-question",
      numChoices: 1,
      choices: [
        { content: "Yes", correct: true },
        { content: "No", correct: false }
      ],
      hints: ["Read carefully"]
    }, as: :json
    assert_response :ok
  end

  test "content_author should destroy question" do
    sign_in @content_author
    assert_difference("Question.count", -1) do
      delete question_path(@question), as: :json
    end
    assert_response :ok
  end

  # Admin role tests
  test "admin should access new" do
    sign_in @admin
    get new_question_path
    assert_response :success
  end

  test "admin should create question with valid data" do
    sign_in @admin
    assert_difference("Question.count") do
      post questions_path, params: {
        question: "What is the capital of Germany? This is a longer question text.",
        slug: "capital-germany",
        numChoices: 1,
        choices: [
          { content: "Berlin", correct: true },
          { content: "Munich", correct: false }
        ],
        hints: ["Think about Germany"]
      }, as: :json
    end
    assert_response :ok
  end

  test "admin should destroy question" do
    sign_in @admin
    assert_difference("Question.count", -1) do
      delete question_path(@question), as: :json
    end
    assert_response :ok
  end
end
