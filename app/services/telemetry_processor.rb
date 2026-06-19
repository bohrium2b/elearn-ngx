# frozen_string_literal: true

class TelemetryProcessor
  REQUIRED_KEYS = %w[exercise_uuid question_responses completed_at].freeze
  QUESTION_RESPONSE_KEYS = %w[question_uuid correct].freeze

  def initialize(payload, user)
    @payload = payload.deep_symbolize_keys
    @user = user
    @errors = []
  end

  def process
    return failure_result unless valid_structure?

    exercise = find_exercise
    return failure_result unless exercise

    score = calculate_score
    tag_registry = build_tag_registry
    topic_registry = build_topic_registry

    success_result(exercise, score, tag_registry, topic_registry)
  end

  def build_topic_registry
    question_ids = @payload[:question_responses].pluck(:question_uuid).compact
    return {} if question_ids.blank?

    questions = Question.where(uuid: question_ids)
                        .includes(:tags, :content_assignments)

    registry = {}

    questions.each do |question|
      direct_topics = question.content_assignments
                              .filter_map(&:taxonomy_node)
                              .select(&:topic?)
      tag_topics = question.tags.flat_map(&:topics).uniq
      all_topics = (direct_topics + tag_topics).uniq

      registry[question.uuid] = all_topics.map do |topic|
        {
          topic_id: topic.id,
          topic_name: topic.name,
          topic_slug: topic.slug,
          path_identifier: topic.path_identifier
        }
      end
    end

    registry
  end

  def process_with_topics(assessment_session)
    telemetry_data = assessment_session.telemetry_data || {}
    question_ids = telemetry_data["question_responses"]&.pluck("question_uuid") || []

    topic_registry = build_topic_registry_from_uuids(question_ids)
    telemetry_data["topic_registry"] = topic_registry
    telemetry_data["topic_performance"] = calculate_topic_performance(
      topic_registry,
      telemetry_data["question_responses"] || []
    )

    assessment_session.update(telemetry_data: telemetry_data)
    telemetry_data
  end

  private

  def valid_structure?
    missing_keys = REQUIRED_KEYS - @payload.keys.map(&:to_s)
    if missing_keys.any?
      @errors << "Missing required keys: #{missing_keys.join(', ')}"
      return false
    end

    unless @payload[:question_responses].is_a?(Array) && @payload[:question_responses].any?
      @errors << "question_responses must be a non-empty array"
      return false
    end

    @payload[:question_responses].each_with_index do |qr, idx|
      missing_qr_keys = QUESTION_RESPONSE_KEYS - qr.keys.map(&:to_s)
      if missing_qr_keys.any?
        @errors << "Question response #{idx}: missing keys #{missing_qr_keys.join(', ')}"
        return false
      end
    end

    true
  end

  def find_exercise
    exercise = Exercise.find_by(uuid: @payload[:exercise_uuid])
    unless exercise
      @errors << "Exercise with UUID #{@payload[:exercise_uuid]} not found"
      return nil
    end
    exercise
  end

  def calculate_score
    total = @payload[:question_responses].count
    correct = @payload[:question_responses].count { |qr| qr[:correct] == true }
    return 0.0 if total.zero?

    ((correct.to_f / total) * 100).round(2)
  end

  def build_tag_registry
    registry = {}
    question_ids = @payload[:question_responses].pluck(:question_uuid).compact

    Question.where(uuid: question_ids).find_each do |question|
      question.tags.each do |tag|
        registry[tag.uuid] = {
          "name" => tag.name,
          "slug" => tag.slug,
          "uuid" => tag.uuid,
          "parent_id" => tag.parent_id,
          "ancestor_path" => ancestor_path(tag)
        }
      end
    end

    registry
  end

  def ancestor_path(tag)
    path = []
    current = tag.parent
    while current
      path.unshift(
        "name" => current.name,
        "uuid" => current.uuid
      )
      current = current.parent
    end
    path
  end

  def success_result(exercise, score, tag_registry, topic_registry)
    {
      success: true,
      exercise: exercise,
      user: @user,
      score_percentage: score,
      duration_seconds: @payload[:duration_seconds],
      completed_at: parse_completed_at,
      telemetry_data: {
        "session_metadata" => @payload[:session_metadata] || {},
        "question_responses" => @payload[:question_responses],
        "tag_registry" => tag_registry,
        "topic_registry" => topic_registry
      }
    }
  end

  def failure_result
    { success: false, errors: @errors }
  end

  def parse_completed_at
    if @payload[:completed_at].is_a?(String)
      Time.zone.parse(@payload[:completed_at])
    else
      @payload[:completed_at] || Time.current
    end
  rescue ArgumentError
    Time.current
  end

  def build_topic_registry_from_uuids(question_uuids)
    return {} if question_uuids.blank?

    questions = Question.where(uuid: question_uuids)
                        .includes(:tags, :content_assignments)

    registry = {}

    questions.each do |question|
      direct_topics = question.content_assignments
                              .filter_map(&:taxonomy_node)
                              .select(&:topic?)
      tag_topics = question.tags.flat_map(&:topics).uniq
      all_topics = (direct_topics + tag_topics).uniq

      registry[question.uuid] = all_topics.map do |topic|
        {
          topic_id: topic.id,
          topic_name: topic.name,
          topic_slug: topic.slug,
          path_identifier: topic.path_identifier
        }
      end
    end

    registry
  end

  def calculate_topic_performance(topic_registry, responses)
    topic_scores = {}

    responses.each do |response|
      q_id = response["question_uuid"] || response[:question_uuid]
      next unless q_id

      topics = topic_registry[q_id.to_s] || []
      correct = response["correct"] == true || response[:correct] == true

      topics.each do |topic|
        topic_id = topic[:topic_id]
        topic_scores[topic_id] ||= { correct: 0, total: 0, topic_name: topic[:topic_name] }
        topic_scores[topic_id][:total] += 1
        topic_scores[topic_id][:correct] += 1 if correct
      end
    end

    topic_scores.transform_values do |scores|
      {
        topic_name: scores[:topic_name],
        correct: scores[:correct],
        total: scores[:total],
        percentage: scores[:total].positive? ? ((scores[:correct].to_f / scores[:total]) * 100).round(2) : 0
      }
    end
  end
end
