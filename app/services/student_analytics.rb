# frozen_string_literal: true

class StudentAnalytics
  def initialize(user)
    @user = user
  end

  # Chronological ledger of all completed exercises (paginated)
  def chronological_ledger(page: 1, per_page: 10)
    @user.assessment_sessions
         .recent
         .includes(:exercise)
         .page(page)
         .per(per_page)
         .map { |session| serialize_ledger_entry(session) }
  end

  # Total count for pagination
  def total_sessions_count
    @user.assessment_sessions.count
  end

  # Questions attempted multiple times with consistently low scores
  # Now shows topic names instead of question slugs
  def weak_points(window: 30.days)
    sessions = @user.assessment_sessions
                    .in_time_window(window)
                    .recent

    question_performance = {}
    question_tags = {}

    sessions.find_each do |session|
      session.question_responses.each do |qr|
        uuid = qr["question_uuid"]
        question_performance[uuid] ||= { correct: 0, total: 0, question_data: qr }
        question_performance[uuid][:total] += 1
        question_performance[uuid][:correct] += 1 if qr["correct"] == true

        # Cache tags for this question
        unless question_tags.key?(uuid)
          question = Question.find_by(uuid: uuid)
          question_tags[uuid] = question&.tags&.pluck(:name) || []
        end
      end
    end

    # Filter: attempted more than once with < 50% success rate
    weak = question_performance.select do |_uuid, perf|
      perf[:total] > 1 && (perf[:correct].to_f / perf[:total]) < 0.5
    end

    weak.map do |_uuid, perf|
      {
        question_uuid: perf[:question_data]["question_uuid"],
        attempts: perf[:total],
        correct: perf[:correct],
        success_rate: ((perf[:correct].to_f / perf[:total]) * 100).round(2),
        last_attempt: perf[:question_data]["completed_at"],
        tags: question_tags[perf[:question_data]["question_uuid"]] || []
      }
    end.sort_by { |wp| wp[:success_rate] }
  end

  # Smart recommendations: generates custom exercises targeting weak areas
  def recommendations(limit: 5)
    generator = PracticeExerciseGenerator.new(@user)
    exercise = generator.generate(question_count: limit)

    return [] unless exercise

    [{
      type: "custom_exercise",
      title: exercise[:title],
      description: exercise[:description],
      tags: extract_tags_from_questions(exercise[:questions]),
      exercise_path: "/exercises/practice?count=#{limit}"
    }]
  end

  # Summary stats for dashboard
  def dashboard_summary
    sessions = @user.assessment_sessions
    recent_sessions = sessions.in_time_window(30.days)
    weekly_sessions = sessions.in_time_window(7.days)
    all_sessions = sessions.to_a

    {
      total_sessions: all_sessions.count,
      average_score: (sessions.average(:score_percentage) || 0).to_f.round(2),
      recent_sessions_count: recent_sessions.count,
      recent_average_score: (recent_sessions.average(:score_percentage) || 0).to_f.round(2),
      weekly_sessions_count: weekly_sessions.count,
      weekly_average_score: (weekly_sessions.average(:score_percentage) || 0).to_f.round(2),
      total_questions_answered: all_sessions.sum(&:total_questions),
      total_correct: all_sessions.sum(&:correct_count),
      current_streak: calculate_streak
    }
  end

  private

  def serialize_ledger_entry(session)
    {
      id: session.id,
      uuid: session.uuid,
      exercise_id: session.exercise_id,
      exercise_title: session.exercise.title,
      score_percentage: session.score_percentage.to_f,
      total_questions: session.total_questions,
      correct_count: session.correct_count,
      duration_seconds: session.duration_seconds,
      completed_at: session.completed_at,
      review_path: "/analytics/#{session.uuid}/review"
    }
  end

  def calculate_streak
    # Streak is defined as number of days in a row with a session score
    sessions = @user.assessment_sessions
                    .recent
                    .where.not(score_percentage: nil)
                    .group_by { |s| s.completed_at.to_date }
    streak = 0
    current_date = Date.current
    while sessions.key?(current_date)
      streak += 1
      current_date -= 1.day
    end
    streak
  end

  def extract_tags_from_questions(questions)
    # This is a simplified version - in practice, you'd want to look up the actual tags
    questions.map.with_index do |q, idx|
      { name: "Topic #{idx + 1}", uuid: "tag-#{idx}" }
    end.uniq
  end
end
