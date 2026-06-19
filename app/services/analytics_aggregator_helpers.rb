# frozen_string_literal: true

module AnalyticsAggregatorHelpers
  def self.build_question_stats
    question_stats = {}
    AssessmentSession.find_each do |session|
      session.question_responses.each do |qr|
        uuid = qr["question_uuid"]
        question_stats[uuid] ||= { correct: 0, total: 0 }
        question_stats[uuid][:total] += 1
        question_stats[uuid][:correct] += 1 if qr["correct"] == true
      end
    end
    question_stats
  end

  def self.format_question_stats(question_stats)
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

  def self.flag_question?(total_attempts, failure_rate)
    return false if total_attempts < 5

    failure_rate >= 0.9
  end

  def self.fetch_tag_question_uuids(tag)
    descendant_uuids = tag.all_descendants.map(&:uuid) + [tag.uuid]
    Question.joins(:tags).where(tags: { uuid: descendant_uuids }).pluck(:uuid).uniq
  end

  def self.calculate_tag_performance(question_uuids)
    total_correct = 0
    total_responses = 0

    AssessmentSession.find_each do |session|
      session.question_responses.each do |qr|
        next unless question_uuids.include?(qr["question_uuid"])

        total_responses += 1
        total_correct += 1 if qr["correct"] == true
      end
    end

    [total_correct, total_responses]
  end
end
