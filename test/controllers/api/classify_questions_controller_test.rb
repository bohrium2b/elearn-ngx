# frozen_string_literal: true

require "test_helper"

module Api
  class ClassifyQuestionsControllerTest < ActionDispatch::IntegrationTest
    test "moves a question from one tag to another inside a transaction" do
      source_tag = create(:tag)
      target_tag = create(:tag)
      question = create(:question)
      question.tags << source_tag

      get root_path
      csrf_token = response.body[/meta name="csrf-token" content="([^"]+)"/, 1]

      patch api_classify_question_path,
            params: {
              question_id: question.id,
              target_tag_id: target_tag.id,
              source_tag_id: source_tag.id
            },
            env: {
              "HTTP_X_CSRF_TOKEN" => csrf_token
            },
            as: :json

      assert_response :success
      assert_equal [target_tag], question.reload.tags.to_a
    end

    test "returns 422 for an invalid target tag" do
      question = create(:question)

      get root_path
      csrf_token = response.body[/meta name="csrf-token" content="([^"]+)"/, 1]

      patch api_classify_question_path,
            params: {
              question_id: question.id,
              target_tag_id: 0,
              source_tag_id: nil
            },
            env: {
              "HTTP_X_CSRF_TOKEN" => csrf_token
            },
            as: :json

      assert_response :unprocessable_entity
      assert_equal "error", response.parsed_body["status"]
    end
  end
end
