# frozen_string_literal: true

class AnalyticsAggregator
  # Instance methods for topic-based analytics
  def topic_performance_matrix(user = nil)
    topics = TaxonomyNode.topics
    topics.map do |topic|
      sessions = topic.assessment_sessions
      sessions = sessions.for_user(user) if user

      total_sessions = sessions.count
      avg_score = total_sessions.positive? ? (sessions.average(:score_percentage) || 0).to_f : 0.0
      completion_rate = if total_sessions.positive?
                          ((sessions.where.not(score_percentage: nil).count.to_f / total_sessions) * 100).round(2)
                        else
                          0.0
                        end

      {
        topic_id: topic.id,
        topic_name: topic.name,
        total_sessions: total_sessions,
        average_score: avg_score.round(2),
        completion_rate: completion_rate
      }
    end
  end

  def topic_average_score(topic, user = nil)
    sessions = topic.assessment_sessions
    sessions = sessions.for_user(user) if user

    total_sessions = sessions.count
    avg_score = total_sessions.positive? ? (sessions.average(:score_percentage) || 0).to_f : 0.0
    recent_sessions = sessions.recent.limit(5).count

    {
      topic_id: topic.id,
      topic_name: topic.name,
      average_score: avg_score.round(2),
      total_sessions: total_sessions,
      recent_sessions: recent_sessions
    }
  end

  def system_topic_performance_matrix
    topics = TaxonomyNode.topics
    matrix = topics.map do |topic|
      sessions = topic.assessment_sessions
      total_sessions = sessions.count
      avg_score = total_sessions.positive? ? (sessions.average(:score_percentage) || 0).to_f : 0.0
      unique_users = sessions.select(:user_id).distinct.count
      completion_rate = if total_sessions.positive?
                          ((sessions.where.not(score_percentage: nil).count.to_f / total_sessions) * 100).round(2)
                        else
                          0.0
                        end

      {
        topic_id: topic.id,
        topic_name: topic.name,
        total_sessions: total_sessions,
        average_score: avg_score.round(2),
        unique_users: unique_users,
        completion_rate: completion_rate
      }
    end

    # Sort by average score descending
    matrix.sort_by { |m| -m[:average_score] }
  end

  def topic_difficulty_ranking
    topics = TaxonomyNode.topics
    ranking = []

    topics.each do |topic|
      sessions = topic.assessment_sessions
      total_sessions = sessions.count

      # Exclude topics with insufficient data (less than 5 sessions)
      next if total_sessions < 5

      avg_score = (sessions.average(:score_percentage) || 0).to_f

      difficulty = case avg_score
                   when 0...40 then "hard"
                   when 40...70 then "medium"
                   else "easy"
                   end

      ranking << {
        topic_id: topic.id,
        topic_name: topic.name,
        average_score: avg_score.round(2),
        total_sessions: total_sessions,
        difficulty: difficulty
      }
    end

    # Sort by average score ascending (hardest first)
    ranking.sort_by { |r| r[:average_score] }
  end

  # Class methods
  def self.cohort_metrics
    sessions = AssessmentSession.recent

    {
      total_sessions: sessions.count,
      unique_students: sessions.select(:user_id).distinct.count,
      average_score: (sessions.average(:score_percentage) || 0).to_f.round(2),
      median_score: calculate_median(sessions),
      average_duration_seconds: (sessions.average(:duration_seconds) || 0).to_f.round(0),
      grade_distribution: grade_distribution(sessions),
      completion_trend: completion_trend(sessions)
    }
  end

  def self.tag_performance_matrix
    root_tags = Tag.where(parent_id: nil).includes(:children)
    root_tags.map { |tag| build_tag_node(tag) }
  end

  def self.item_discrimination_metrics
    question_stats = AnalyticsAggregatorHelpers.build_question_stats
    AnalyticsAggregatorHelpers.format_question_stats(question_stats)
  end

  def self.tag_average_score(tag_uuid)
    tag = Tag.find_by(uuid: tag_uuid)
    return nil unless tag

    question_uuids = AnalyticsAggregatorHelpers.fetch_tag_question_uuids(tag)
    return nil if question_uuids.empty?

    total_correct, total_responses = AnalyticsAggregatorHelpers.calculate_tag_performance(question_uuids)
    return nil if total_responses.zero?

    {
      tag_name: tag.name,
      tag_uuid: tag.uuid,
      total_responses: total_responses,
      correct_count: total_correct,
      average_score: ((total_correct.to_f / total_responses) * 100).round(2)
    }
  end

  def self.calculate_median(sessions)
    scores = sessions.pluck(:score_percentage).compact.map(&:to_f).sort
    return 0.0 if scores.empty?

    len = scores.length
    if len.odd?
      scores[len / 2].round(2)
    else
      ((scores[(len / 2) - 1] + scores[len / 2]) / 2.0).round(2)
    end
  end

  def self.grade_distribution(sessions)
    distribution = { "A (90-100)" => 0, "B (80-89)" => 0, "C (70-79)" => 0, "D (60-69)" => 0, "F (<60)" => 0 }

    sessions.find_each do |session|
      score = session.score_percentage.to_f
      case score
      when 90..100 then distribution["A (90-100)"] += 1
      when 80...90 then distribution["B (80-89)"] += 1
      when 70...80 then distribution["C (70-79)"] += 1
      when 60...70 then distribution["D (60-69)"] += 1
      else distribution["F (<60)"] += 1
      end
    end

    distribution
  end

  def self.completion_trend(sessions)
    sessions.reorder(nil)
            .where(completed_at: 30.days.ago..)
            .group("DATE(completed_at)")
            .count
  end

  def self.build_tag_node(tag)
    descendant_uuids = tag.all_descendants.map(&:uuid) + [tag.uuid]
    question_uuids = Question.joins(:tags).where(tags: { uuid: descendant_uuids }).pluck(:uuid).uniq

    total_correct = 0
    total_responses = 0

    AssessmentSession.find_each do |session|
      session.question_responses.each do |qr|
        next unless question_uuids.include?(qr["question_uuid"])

        total_responses += 1
        total_correct += 1 if qr["correct"] == true
      end
    end

    avg_score = total_responses.zero? ? 0.0 : ((total_correct.to_f / total_responses) * 100).round(2)

    {
      uuid: tag.uuid,
      name: tag.name,
      slug: tag.slug,
      color: tag.color,
      average_score: avg_score,
      total_responses: total_responses,
      children: tag.children.map { |child| build_tag_node(child) }
    }
  end
end
