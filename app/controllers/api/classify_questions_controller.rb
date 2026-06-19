# frozen_string_literal: true

module Api
  class ClassifyQuestionsController < ApplicationController
    protect_from_forgery with: :exception

    def update
      question = Question.find(params.require(:question_id))
      target_tag = Tag.find(params.require(:target_tag_id))
      source_tag = params[:source_tag_id].present? ? Tag.find(params[:source_tag_id]) : nil

      Question.transaction do
        question.tags.delete(source_tag) if source_tag
        question.tags << target_tag unless question.tags.exists?(target_tag.id)
      end

      render json: { status: "success" }, status: :ok
    rescue ActiveRecord::RecordNotFound, ActiveRecord::RecordInvalid, ActiveRecord::StatementInvalid => e
      render json: { status: "error", message: e.message }, status: :unprocessable_content
    end
  end
end
