# frozen_string_literal: true

require "test_helper"

class QuestionsHelperTest < ActionView::TestCase
  include IslandsHelper

  # ============================================================================
  # render_quiz_island
  # ============================================================================

  test "render_quiz_island renders island tag" do
    question = create(:question)
    result = render_quiz_island("quiz-island", question)
    assert_includes result, "<quiz-island"
    assert_includes result, "</quiz-island>"
  end

  test "render_quiz_island includes question data" do
    question = create(:question, question_id_code: "Q-100", config_data: {
                        question: "What is 2+2?",
                        choices: [{ content: "4", correct: true }, { content: "3", correct: false }],
                        hints: ["Count"],
                        numChoices: 1
                      })

    result = render_quiz_island("quiz-island", question)
    assert_includes result, "data-props"
    assert_includes result, "Q-100"
  end

  test "render_quiz_island handles nil config_data" do
    question = create(:question, config_data: nil)
    result = render_quiz_island("quiz-island", question)
    assert_includes result, "data-props"
  end

  test "render_quiz_island uses question_id_code" do
    question = create(:question, question_id_code: "CUSTOM-CODE")
    result = render_quiz_island("quiz-island", question)
    assert_includes result, "CUSTOM-CODE"
  end

  test "render_quiz_island passes question payload" do
    question = create(:question)
    result = render_quiz_island("quiz-island", question)

    # Verify JSON is present
    json_match = result.match(/data-props="([^"]+)"/)
    assert json_match
  end
end
