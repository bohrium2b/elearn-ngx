# frozen_string_literal: true

module Api
  class AssessmentSessionsController < ApplicationController
    before_action :authenticate_user!

    rescue_from Pundit::NotAuthorizedError, with: :user_not_authorized_api

    # GET /api/assessment_sessions
    def index
      @sessions = policy_scope(AssessmentSession).recent
      @sessions = @sessions.for_exercise(Exercise.find(params[:exercise_id])) if params[:exercise_id]

      render json: {
        sessions: @sessions.map { |s| serialize_session(s) }
      }
    end

    # GET /api/assessment_sessions/:id
    def show
      @session = AssessmentSession.find(params[:id])
      authorize @session

      render json: { session: serialize_session_detail(@session) }
    end

    # POST /api/assessment_sessions
    def create
      result = TelemetryProcessor.new(permitted_params, current_user).process
      Rails.logger.info "Processed assessment session creation request for user #{current_user.id}, result: #{result}"
      unless result[:success]
        Rails.logger.error "Failed to create assessment session for user #{current_user.id}, with error: #{result[:errors]}"
        render json: { errors: result[:errors] }, status: :unprocessable_content
        return
      end

      @session = AssessmentSession.new(
        user: result[:user],
        exercise: result[:exercise],
        score_percentage: result[:score_percentage],
        duration_seconds: result[:duration_seconds],
        completed_at: result[:completed_at],
        telemetry_data: result[:telemetry_data]
      )

      authorize @session

      if @session.save
        render json: { session: serialize_session(@session) }, status: :created
      else
        Rails.logger.error "Failed to create assessment session for user #{current_user.id}, with error: #{@session.errors.full_messages}"
        render json: { errors: @session.errors.full_messages }, status: :unprocessable_content
      end
    end

    private

    def user_not_authorized_api
      render json: { error: "You are not authorized to perform this action." }, status: :forbidden
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
