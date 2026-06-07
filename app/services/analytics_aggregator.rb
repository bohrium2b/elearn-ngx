# frozen_string_literal: true

class AnalyticsAggregator
  # High-level cohort metrics
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

  # Hierarchical tag performance matrix
  def self.tag_performance_matrix
    root_tags = Tag.where(parent_id: nil).includes(:children)

    root_tags.map { |tag| build_tag_node(tag) }
  end

  # Item discrimination: flag questions with anomalous failure rates
  def self.item_discrimination_metrics
    question_stats = {}

    AssessmentSession.find_each do |session|
      session.question_responses.each do |qr|
        uuid = qr["question_uuid"]
        question_stats[uuid] ||= { correct: 0, total: 0 }
        question_stats[uuid][:total] += 1
        question_stats[uuid][:correct] += 1 if qr["correct"] == true
      end
    end

    question_stats.map do |_uuid, stats|
      failure_rate = 1.0 - (stats[:correct].to_f / stats[:total])
      {
        question_uuid: _uuid,
        total_attempts: stats[:total],
        correct_count: stats[:correct],
        failure_rate: (failure_rate * 100).round(2),
        flagged: flag_question?(stats[:total], failure_rate)
      }
    end.sort_by { |m| -m[:failure_rate] }
  end

  # Average performance score for a specific tag across all students
  def self.tag_average_score(tag_uuid)
    tag = Tag.find_by(uuid: tag_uuid)
    return nil unless tag

    descendant_uuids = tag.all_descendants.map(&:uuid) + [tag.uuid]
    question_uuids = Question.joins(:tags).where(tags: { uuid: descendant_uuids }).pluck(:uuid).uniq

    return nil if question_uuids.empty?

    total_correct = 0
    total_responses = 0

    AssessmentSession.find_each do |session|
      session.question_responses.each do |qr|
        next unless question_uuids.include?(qr["question_uuid"])

        total_responses += 1
        total_correct += 1 if qr["correct"] == true
      end
    end

    return nil if total_responses.zero?

    {
      tag_name: tag.name,
      tag_uuid: tag.uuid,
      total_responses: total_responses,
      correct_count: total_correct,
      average_score: ((total_correct.to_f / total_responses) * 100).round(2)
    }
  end

  private

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
            .where("completed_at >= ?", 30.days.ago)
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

  def self.flag_question?(total_attempts, failure_rate)
    return false if total_attempts < 5

    failure_rate >= 0.9
  end
end
