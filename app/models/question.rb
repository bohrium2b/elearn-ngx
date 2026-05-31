class Question < ApplicationRecord
  before_validation :ensure_uuid, on: :create
  before_validation :ensure_slug, on: :create

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
      "#{uuid}-#{slug}"
    else
      slug.presence || id.to_s
    end
  end
end
