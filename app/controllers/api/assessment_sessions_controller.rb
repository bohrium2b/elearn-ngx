# frozen_string_literal: true

module Api
  class AssessmentSessionsController < AuthenticatedController

    rescue_from Pundit::NotAuthorizedError, with: :user_not_authorized_api

    def index
      authorize AssessmentSession
      @sessions = policy_scope(AssessmentSession).recent
      @sessions = @sessions.for_exercise(Exercise.find(params[:exercise_id])) if params[:exercise_id]

      render json: {
        sessions: @sessions.map { |s| serialize_session(s) }
      }
    end

    def show
      @session = AssessmentSession.find(params[:id])
      authorize @session

      render json: { session: serialize_session_detail(@session) }
    end

    def create
      authorize AssessmentSession
      result = TelemetryProcessor.new(permitted_params, current_user).process
      log_create_result(result)
      return render json: { errors: result[:errors] }, status: :unprocessable_content unless result[:success]

      @session = build_assessment_session(result)
      authorize @session

      if save_and_process_session(@session, result)
        render json: { session: serialize_session(@session) }, status: :created
      else
        render json: { errors: @session.errors.full_messages }, status: :unprocessable_content
      end
    end

    private

    def log_create_result(result)
      Rails.logger.info "Processed assessment session creation request for user #{current_user.id}, result: #{result}"
      return if result[:success]

      Rails.logger.error "Failed to create assessment session for user #{current_user.id}, with error: #{result[:errors]}"
    end

    def build_assessment_session(result)
      AssessmentSession.new(
        user: result[:user],
        exercise: result[:exercise],
        score_percentage: result[:score_percentage],
        duration_seconds: result[:duration_seconds],
        completed_at: result[:completed_at],
        telemetry_data: result[:telemetry_data]
      )
    end

    def save_and_process_session(session, result)
      if session.save
        assign_topic_to_session(session)
        process_telemetry(session, result)
        true
      else
        Rails.logger.error "Failed to create assessment session for user #{current_user.id}, with error: #{session.errors.full_messages}"
        false
      end
    end

    def assign_topic_to_session(session)
      return if params[:topic_id].blank?

      topic = TaxonomyNode.find_by(param: params[:topic_id])
      session.update(taxonomy_node: topic) if topic
    end

    def process_telemetry(session, result)
      telemetry_processor = TelemetryProcessor.new(permitted_params, result[:user])
      telemetry_processor.process_with_topics(session)
    end

    def user_not_authorized_api
      render json: { error: t("messages.not_authorized") }, status: :forbidden
    end

    def permitted_params
      params.permit(
        :exercise_uuid,
        :duration_seconds,
        :completed_at,
        session_metadata: {},
        question_responses: %i[question_uuid correct choices_selected hints_used retry_count time_spent]
      ).to_h
    end

    def serialize_session(session)
      {
        id: session.id,
        user_id: session.user_id,
        exercise_id: session.exercise_id,
        exercise_title: session.exercise.title,
        score_percentage: session.score_percentage.to_f,
        duration_seconds: session.duration_seconds,
        completed_at: session.completed_at,
        total_questions: session.total_questions,
        correct_count: session.correct_count,
        created_at: session.created_at
      }
    end

    def serialize_session_detail(session)
      serialize_session(session).merge(
        telemetry_data: session.telemetry_data,
        question_responses: session.question_responses,
        tag_registry: session.tag_registry
      )
    end
  end
end
