# frozen_string_literal: true

class Question < ApplicationRecord
  include FindByParamable

  before_validation :ensure_uuid, on: :create
  before_validation :ensure_slug, on: :create
  before_save :sanitize_config_data

  has_and_belongs_to_many :tags

  scope :untagged, -> { where.missing(:tags) }

  validate :config_data_schema

  def ensure_uuid
    self.uuid ||= SecureRandom.uuid
  end

  def ensure_slug
    return if slug.present?

    base = respond_to?(:title) ? title.to_s.parameterize : nil
    candidate = base.presence || "question-#{id || SecureRandom.hex(4)}"
    counter = 0
    while self.class.exists?(slug: candidate)
      counter += 1
      candidate = "#{base}-#{counter}"
    end
    self.slug = candidate
  end

  def to_param
    if uuid.present? && slug.present?
      "#{uuid}-x:#{slug}"
    else
      slug.presence || id.to_s
    end
  end

  private

  def sanitize_config_data
    return unless config_data.is_a?(Hash)

    if config_data["question"].is_a?(String)
      config_data["question"] = sanitize_html(config_data["question"])
    end

    if config_data["choices"].is_a?(Array)
      config_data["choices"] = config_data["choices"].map do |choice|
        sanitized = choice.dup
        sanitized["content"] = sanitize_html(sanitized["content"].to_s)
        sanitized["rationale"] = sanitize_html(sanitized["rationale"].to_s) if sanitized["rationale"]
        sanitized
      end
    end

    if config_data["hints"].is_a?(Array)
      config_data["hints"] = config_data["hints"].map { |hint| sanitize_html(hint.to_s) }
    end
  end

  def sanitize_html(html)
    Nokogiri::HTML::DocumentFragment.parse(html.to_s).text
  end

  def config_data_schema
    data = config_data || {}
    return if data.empty? && !config_data_previously_changed?

    errors.add(:config_data, "must be a hash") unless data.is_a?(Hash)

    return unless data.is_a?(Hash)

    question_text = data["question"].to_s.strip
    errors.add(:config_data, "question must be at least 10 characters long") if question_text.length < 10

    choices = Array(data["choices"])
    errors.add(:config_data, "must include at least two choices") if choices.length < 2

    num_choices = data["numChoices"].to_i
    errors.add(:config_data, "numChoices must be at least 1") if num_choices < 1

    has_correct = choices.any? { |c| ActiveModel::Type::Boolean.new.cast(c["correct"]) }
    errors.add(:config_data, "must have at least one correct choice") unless has_correct
  end
end
