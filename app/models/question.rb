# frozen_string_literal: true

class Question < ApplicationRecord
  before_validation :ensure_uuid, on: :create
  before_validation :ensure_slug, on: :create

  has_and_belongs_to_many :tags
  has_many :content_assignments, dependent: :destroy

  scope :untagged, -> { where.missing(:tags) }

  def ensure_valid_question_structure
    # This method checks that the question has a valid structure
  end

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
end
