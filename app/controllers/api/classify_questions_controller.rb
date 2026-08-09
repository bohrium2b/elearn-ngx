# frozen_string_literal: true

module Api
  class ClassifyQuestionsController < AuthenticatedController
    before_action :set_question_and_tags

    def update
      authorize @question
      authorize @target_tag

      Question.transaction do
        @question.tags.delete(@source_tag) if @source_tag
        @question.tags << @target_tag unless @question.tags.exists?(@target_tag.id)
      end

      render json: { status: "success" }, status: :ok
    rescue ActiveRecord::RecordNotFound, ActiveRecord::RecordInvalid, ActiveRecord::StatementInvalid => e
      render json: { status: "error", message: e.message }, status: :unprocessable_content
    end

    private

    def set_question_and_tags
      @question = Question.find(params.require(:question_id))
      @target_tag = Tag.find(params.require(:target_tag_id))
      @source_tag = params[:source_tag_id].present? ? Tag.find(params[:source_tag_id]) : nil
    rescue ActiveRecord::RecordNotFound => e
      render json: { status: "error", message: e.message }, status: :unprocessable_content
    end
  end
end
