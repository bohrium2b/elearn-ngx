require "test_helper"

class QuestionTest < ActiveSupport::TestCase
  test "untagged scope returns only questions without tags" do
    tagged_question = create(:question)
    untagged_question = create(:question)
    tag = create(:tag)
    tagged_question.tags << tag

    assert_includes Question.untagged, untagged_question
    assert_not_includes Question.untagged, tagged_question
  end
end
