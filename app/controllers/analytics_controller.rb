# frozen_string_literal: true

class AnalyticsController < AuthenticatedController
  skip_after_action :verify_authorized

  def index
    redirect_to dashboard_analytics_path
  end

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

  def review
    # rubocop:disable Rails/DynamicFindBy
    @session = AssessmentSession.find_by_uuid_or_id(params[:id])
    # rubocop:enable Rails/DynamicFindBy
    return redirect_to_review_alert unless @session
    return redirect_to_unauthorized_review unless can_review?(@session)

    respond_to do |format|
      format.html
      format.json { render json: review_json }
    end
  end

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

  def cohort
    unless can_view_instructor_data?
      return redirect_to dashboard_analytics_path,
                         alert: t("messages.not_authorized_cohort")
    end

    respond_to do |format|
      format.html
      format.json { render json: { cohort: AnalyticsAggregator.cohort_metrics } }
    end
  end

  def tag_matrix
    unless can_view_instructor_data?
      return redirect_to dashboard_analytics_path,
                         alert: t("messages.not_authorized_tag_matrix")
    end

    respond_to do |format|
      format.html
      format.json { render json: { tag_matrix: AnalyticsAggregator.tag_performance_matrix } }
    end
  end

  def item_discrimination
    unless can_view_instructor_data?
      return redirect_to dashboard_analytics_path,
                         alert: t("messages.not_authorized_item_discrimination")
    end

    respond_to do |format|
      format.html
      format.json { render json: { items: AnalyticsAggregator.item_discrimination_metrics } }
    end
  end

  def performance_logs
    unless can_view_instructor_data?
      return redirect_to dashboard_analytics_path,
                         alert: t("messages.not_authorized_performance_logs")
    end

    respond_to do |format|
      format.html
      format.json do
        sessions = AssessmentSession.recent.limit(100)
        render json: { sessions: sessions.map { |s| serialize_performance_log(s) } }
      end
    end
  end

  private

  def can_review?(session)
    session.user_id == current_user.id || current_user.instructor? || current_user.admin?
  end

  def can_view_instructor_data?
    current_user.instructor? || current_user.admin?
  end

  def redirect_to_review_alert
    redirect_to dashboard_analytics_path, alert: t("messages.session_not_found")
  end

  def redirect_to_unauthorized_review
    redirect_to dashboard_analytics_path, alert: t("messages.not_authorized_view_session")
  end

  def review_json
    {
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

  def enrich_question_responses(question_responses)
    question_uuids = question_responses.filter_map { |qr| qr["question_uuid"] }
    questions = Question.where(uuid: question_uuids).index_by(&:uuid)

    question_responses.map do |qr|
      question = questions[qr["question_uuid"]]
      next qr unless question

      config = question.config_data || {}
      correct_choice = (config["choices"] || []).find { |c| c["correct"] }
      qr.merge(
        "question_text" => config["question"],
        "choices" => config["choices"],
        "correct_answer" => correct_choice&.dig("content"),
        "rationale" => correct_choice&.dig("rationale")
      )
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
