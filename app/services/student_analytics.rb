# frozen_string_literal: true

class StudentAnalytics
  def initialize(user)
    @user = user
  end

  def chronological_ledger(page: 1, per_page: 10)
    @user.assessment_sessions
         .recent
         .includes(:exercise)
         .page(page)
         .per(per_page)
         .map { |session| serialize_ledger_entry(session) }
  end

  def total_sessions_count
    @user.assessment_sessions.count
  end

  def weak_points(window: 30.days)
    sessions = @user.assessment_sessions
                    .in_time_window(window)
                    .recent

    question_performance = {}
    question_tags = {}

    collect_question_performance(sessions, question_performance, question_tags)
    filter_and_format_weak_points(question_performance, question_tags)
  end

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

  def weak_points_by_topic
    topics = TaxonomyNode.topics.includes(:assessment_sessions)

    topic_performance = topics.filter_map do |topic|
      sessions = topic.assessment_sessions.where(user: @user)
      next if sessions.empty?

      avg_score = sessions.average(:score_percentage) || 0

      {
        topic_id: topic.id,
        topic_name: topic.name,
        average_score: avg_score.round(2),
        sessions_count: sessions.count,
        weak_area: avg_score < 70
      }
    end

    topic_performance.sort_by { |tp| tp[:average_score] }
  end

  def topic_recommendations
    weak_points = weak_points_by_topic
    weak_topics = weak_points.select { |tp| tp[:weak_area] }.first(5)

    weak_topics.map do |wt|
      topic = TaxonomyNode.find(wt[:topic_id])
      {
        topic_id: topic.id,
        topic_name: topic.name,
        reason: "Low average score (#{wt[:average_score].round}%)",
        exercises: topic.topic_exercises.includes(:exercise).limit(3).map do |te|
          { id: te.exercise_id, name: te.exercise.title }
        end,
        questions_count: topic.questions.count
      }
    end
  end

  def performance_by_topic(timeframe: 30.days)
    sessions = @user.assessment_sessions
                    .where("completed_at > ?", timeframe.ago)
                    .where.not(taxonomy_node_id: nil)

    topic_performance = {}

    sessions.find_each do |session|
      topic = session.taxonomy_node
      next unless topic

      topic_performance[topic.id] ||= {
        topic_id: topic.id,
        topic_name: topic.name,
        sessions_count: 0,
        total_score: 0,
        average_score: 0
      }

      topic_performance[topic.id][:sessions_count] += 1
      topic_performance[topic.id][:total_score] += session.score_percentage || 0
    end

    topic_performance.each_value do |data|
      data[:average_score] = (data[:total_score].to_f / data[:sessions_count]).round(2)
    end

    topic_performance.values.sort_by { |tp| -tp[:average_score] }
  end

  def topic_mastery_levels
    topics = TaxonomyNode.topics.includes(:assessment_sessions)

    topics.filter_map do |topic|
      sessions = topic.assessment_sessions.where(user: @user)
      next if sessions.empty?

      avg_score = (sessions.average(:score_percentage) || 0).round(2)

      {
        topic_id: topic.id,
        topic_name: topic.name,
        average_score: avg_score,
        sessions_count: sessions.count,
        mastery_level: determine_mastery_level(avg_score / 100.0)
      }
    end.sort_by { |tm| -tm[:average_score] }
  end

  private

  def collect_question_performance(sessions, question_performance, question_tags)
    sessions.find_each do |session|
      session.question_responses.each do |qr|
        uuid = qr["question_uuid"]
        question_performance[uuid] ||= { correct: 0, total: 0, question_data: qr }
        question_performance[uuid][:total] += 1
        question_performance[uuid][:correct] += 1 if qr["correct"] == true

        unless question_tags.key?(uuid)
          question = Question.find_by(uuid: uuid)
          question_tags[uuid] = question&.tags&.pluck(:name) || []
        end
      end
    end
  end

  def filter_and_format_weak_points(question_performance, question_tags)
    weak = question_performance.select do |_uuid, perf|
      perf[:total] > 1 && (perf[:correct].to_f / perf[:total]) <= 0.5
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

  def determine_mastery_level(score)
    case score
    when 0.9..1.0 then "mastered"
    when 0.7...0.9 then "proficient"
    when 0.5...0.7 then "developing"
    else "needs_improvement"
    end
  end

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
    questions.map.with_index do |_q, idx|
      { name: "Topic #{idx + 1}", uuid: "tag-#{idx}" }
    end.uniq
  end
end
