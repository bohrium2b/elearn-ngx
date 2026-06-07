# frozen_string_literal: true

class AssessmentSession < ApplicationRecord
  belongs_to :user
  belongs_to :exercise

  before_validation :ensure_uuid, on: :create

  validates :user, presence: true
  validates :exercise, presence: true
  validates :score_percentage, presence: true,
                               numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 100 }
  validates :completed_at, presence: true
  validates :telemetry_data, presence: true
  validates :uuid, presence: true, uniqueness: true

  # Scopes
  scope :recent, -> { order(completed_at: :desc) }
  scope :for_user, ->(user) { where(user: user) }
  scope :for_exercise, ->(exercise) { where(exercise: exercise) }
  scope :completed_after, ->(date) { where("completed_at >= ?", date) }
  scope :completed_before, ->(date) { where("completed_at <= ?", date) }
  scope :in_time_window, ->(duration) { completed_after(duration.ago) }

  # Accessors for structured telemetry data
  def question_responses
    telemetry_data["question_responses"] || []
  end

  def tag_registry
    telemetry_data["tag_registry"] || {}
  end

  def session_metadata
    telemetry_data["session_metadata"] || {}
  end

  # Returns unique question UUIDs from this session
  def question_uuids
    question_responses.map { |qr| qr["question_uuid"] }.compact.uniq
  end

  # Returns the count of correct responses
  def correct_count
    question_responses.count { |qr| qr["correct"] == true }
  end

  # Returns the total number of questions
  def total_questions
    question_responses.count
  end

  # Recalculate score from question responses
  def recalculate_score
    return 0.0 if total_questions.zero?

    ((correct_count.to_f / total_questions) * 100).round(2)
  end

  # Timing support
  def timed?
    duration_seconds.present? && duration_seconds.positive?
  end

  def formatted_duration
    return "N/A" unless timed?

    minutes = duration_seconds / 60
    seconds = duration_seconds % 60
    if minutes.positive?
      "#{minutes}m #{seconds}s"
    else
      "#{seconds}s"
    end
  end

  # Find by UUID or ID
  def self.find_by_uuid_or_id(param)
    return nil if param.blank?

    if param.match?(/\A[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\z/i)
      find_by(uuid: param)
    else
      find_by(id: param)
    end
  end

  private

  def ensure_uuid
    self.uuid ||= SecureRandom.uuid
  end
end
