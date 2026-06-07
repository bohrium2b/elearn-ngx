# frozen_string_literal: true

class AnalyticsController < ApplicationController
  before_action :authenticate_user!

  # GET /analytics - redirect to dashboard
  def index
    redirect_to dashboard_analytics_path
  end

  # GET /analytics/dashboard
  # Student personal performance dashboard
  def dashboard
    @student_analytics = StudentAnalytics.new(current_user)

    respond_to do |format|
      format.html
      format.json do
        render json: {
          summary: @student_analytics.dashboard_summary,
          ledger: @student_analytics.chronological_ledger,
          weak_points: @student_analytics.weak_points,
          recommendations: @student_analytics.recommendations
        }
      end
    end
  end

  # GET /analytics/:id/review
  # Detailed question review for a specific session
  def review
    @session = AssessmentSession.find_by_uuid_or_id(params[:id])

    unless @session
      redirect_to dashboard_analytics_path, alert: "Session not found."
      return
    end

    # Permission check: only session owner, instructors, or admins can view
    unless @session.user_id == current_user.id || current_user.instructor? || current_user.admin?
      redirect_to dashboard_analytics_path, alert: "You are not authorized to view this session."
      return
    end

    respond_to do |format|
      format.html
      format.json do
        render json: {
          session: {
            id: @session.id,
            uuid: @session.uuid,
            exercise_title: @session.exercise.title,
            score_percentage: @session.score_percentage.to_f,
            duration_seconds: @session.duration_seconds,
            completed_at: @session.completed_at,
            question_responses: enrich_question_responses(@session.question_responses),
            tag_registry: @session.tag_registry
          }
        }
      end
    end
  end

  # GET /analytics/weak_points
  # System deficit tracker
  def weak_points
    window = params[:window].present? ? params[:window].to_i.days : 30.days
    @student_analytics = StudentAnalytics.new(current_user)

    respond_to do |format|
      format.html
      format.json do
        render json: {
          weak_points: @student_analytics.weak_points(window: window),
          window_days: (window / 1.day).to_i
        }
      end
    end
  end

  # GET /analytics/recommendations
  # Smart recommendation engine - generates custom exercises
  def recommendations
    @student_analytics = StudentAnalytics.new(current_user)

    respond_to do |format|
      format.html
      format.json do
        render json: {
          recommendations: @student_analytics.recommendations
        }
      end
    end
  end

  # GET /analytics/cohort
  # High-level cohort monitor (instructor/admin only)
  def cohort
    unless current_user.instructor? || current_user.admin?
      redirect_to dashboard_analytics_path, alert: "You are not authorized to view cohort data."
      return
    end

    respond_to do |format|
      format.html
      format.json do
        render json: {
          cohort: AnalyticsAggregator.cohort_metrics
        }
      end
    end
  end

  # GET /analytics/tag_matrix
  # System-wide tag breakdown matrix (instructor/admin only)
  def tag_matrix
    unless current_user.instructor? || current_user.admin?
      redirect_to dashboard_analytics_path, alert: "You are not authorized to view tag matrix."
      return
    end

    respond_to do |format|
      format.html
      format.json do
        render json: {
          tag_matrix: AnalyticsAggregator.tag_performance_matrix
        }
      end
    end
  end

  # GET /analytics/item_discrimination
  # Item discrimination metric tracker (instructor/admin only)
  def item_discrimination
    unless current_user.instructor? || current_user.admin?
      redirect_to dashboard_analytics_path, alert: "You are not authorized to view item discrimination data."
      return
    end

    respond_to do |format|
      format.html
      format.json do
        render json: {
          items: AnalyticsAggregator.item_discrimination_metrics
        }
      end
    end
  end

  # GET /analytics/performance_logs
  def performance_logs
    unless current_user.instructor? || current_user.admin?
      redirect_to dashboard_analytics_path, alert: "You are not authorized to view performance logs."
      return
    end

    respond_to do |format|
      format.html
      format.json do
        sessions = AssessmentSession.recent.limit(100)
        render json: {
          sessions: sessions.map { |s| serialize_performance_log(s) }
        }
      end
    end
  end

  private

  def enrich_question_responses(question_responses)
    question_responses.map do |qr|
      question = Question.find_by(uuid: qr["question_uuid"])
      if question
        config = question.config_data || {}
        qr.merge(
          "question_text" => config["question"],
          "choices" => config["choices"],
          "correct_answer" => (config["choices"] || []).find { |c| c["correct"] }&.dig("content"),
          "rationale" => (config["choices"] || []).find { |c| c["correct"] }&.dig("rationale")
        )
      else
        qr
      end
    end
  end

  def serialize_performance_log(session)
    {
      id: session.id,
      uuid: session.uuid,
      user_id: session.user_id,
      exercise_id: session.exercise_id,
      exercise_title: session.exercise.title,
      score_percentage: session.score_percentage.to_f,
      duration_seconds: session.duration_seconds,
      completed_at: session.completed_at,
      total_questions: session.total_questions,
      correct_count: session.correct_count
    }
  end
end
