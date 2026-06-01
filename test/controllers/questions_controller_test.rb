require "test_helper"

class QuestionsControllerTest < ActionDispatch::IntegrationTest
  setup do
    host! "localhost"
    @original_forgery_protection = ActionController::Base.allow_forgery_protection
    ActionController::Base.allow_forgery_protection = false
  end

  teardown do
    ActionController::Base.allow_forgery_protection = @original_forgery_protection
  end

  test "rejects short questions and missing correct choices in json" do
    post questions_path,
         params: {
           question: "Too short",
           slug: "question-short",
           numChoices: 1,
           choices: [
             { content: "Choice A", correct: false },
             { content: "Choice B", correct: false }
           ],
           hints: []
         },
         as: :json

    assert_response :unprocessable_entity
    assert_equal "Question must be at least 10 characters long.", response.parsed_body["message"]
  end

  test "returns an updated question payload for inline json edits" do
    question = create(:question, question_id_code: "Q-303")

    patch question_path(question),
          params: {
            question: "What is the new answer?",
            slug: "q-303-new",
            numChoices: 1,
            choices: [
              { content: "Yes", correct: true },
              { content: "No", correct: false }
            ],
            hints: ["Read carefully"]
          },
          env: {
            "HTTP_X_INLINE_EDIT" => "true"
          },
          as: :json

    assert_response :success
    assert_equal "q-303-new", response.parsed_body["question"]["slug"]
    assert_equal "What is the new answer?", response.parsed_body["question"]["question"]
  end
end
