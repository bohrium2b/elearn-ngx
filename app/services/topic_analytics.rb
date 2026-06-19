# frozen_string_literal: true

class TopicAnalytics
  def initialize(user = nil)
    @user = user
  end

  def topic_performance_matrix
    topics = TaxonomyNode.topics.includes(:assessment_sessions)

    topics.map do |topic|
      sessions = topic.assessment_sessions
      sessions = sessions.where(user: @user) if @user

      {
        topic_id: topic.id,
        topic_name: topic.name,
        total_sessions: sessions.count,
        average_score: (sessions.average(:score_percentage) || 0).to_f.round(2),
        completion_rate: calculate_completion_rate(sessions)
      }
    end
  end

  def topic_average_score(topic)
    sessions = topic.assessment_sessions
    sessions = sessions.where(user: @user) if @user

    {
      average_score: (sessions.average(:score_percentage) || 0).to_f.round(2),
      total_sessions: sessions.count,
      recent_sessions: sessions.recent.limit(5).map do |s|
        {
          id: s.id,
          score: s.score_percentage,
          created_at: s.completed_at
        }
      end
    }
  end

  def system_topic_performance_matrix
    topics = TaxonomyNode.topics.includes(:assessment_sessions)

    topics.map do |topic|
      sessions = topic.assessment_sessions

      {
        topic_id: topic.id,
        topic_name: topic.name,
        total_sessions: sessions.count,
        unique_users: sessions.select(:user_id).distinct.count,
        average_score: (sessions.average(:score_percentage) || 0).round(2),
        completion_rate: calculate_topic_completion_rate(sessions)
      }
    end.sort_by { |tp| -tp[:average_score] }
  end

  def topic_difficulty_ranking
    topics = TaxonomyNode.topics.includes(:assessment_sessions)

    topics.filter_map do |topic|
      sessions = topic.assessment_sessions
      next if sessions.count < 5

      avg_score = sessions.average(:score_percentage) || 0

      {
        topic_id: topic.id,
        topic_name: topic.name,
        average_score: avg_score.round(2),
        difficulty: calculate_difficulty(avg_score),
        sessions_count: sessions.count
      }
    end.sort_by { |td| td[:average_score] }
  end

  private

  def calculate_completion_rate(sessions)
    return 0 if sessions.none?

    100.0
  end

  def calculate_topic_completion_rate(sessions)
    return 0 if sessions.none?

    100.0
  end

  def calculate_difficulty(avg_score)
    score = avg_score / 100.0
    case score
    when 0.0...0.4 then "hard"
    when 0.4...0.7 then "medium"
    else "easy"
    end
  end
end
