# frozen_string_literal: true

class TaxonomyNode < ApplicationRecord
  # Enums
  enum :level, { course: 0, part: 1, unit: 2, topic: 3 }

  # Associations
  belongs_to :parent, class_name: "TaxonomyNode", optional: true
  belongs_to :course, class_name: "TaxonomyNode", optional: true

  has_many :children, class_name: "TaxonomyNode", foreign_key: :parent_id, dependent: :destroy, inverse_of: :parent
  has_many :content_assignments, dependent: :destroy
  has_many :questions, through: :content_assignments
  has_many :tags, dependent: :nullify
  has_many :topic_tags, dependent: :destroy
  has_many :topic_exercises, dependent: :destroy
  has_many :exercises, through: :topic_exercises
  has_many :assessment_sessions, dependent: :nullify

  # Validations
  validates :name, presence: true
  validates :slug, presence: true, uniqueness: true
  validates :uuid, presence: true, uniqueness: true
  validates :level, presence: true

  validate :slug_prefix_matches_level
  validate :no_circular_references
  validate :intra_course_uniqueness

  # Callbacks
  before_validation :generate_uuid, on: :create
  before_validation :generate_slug, on: :create

  # Scopes
  scope :roots, -> { where(parent_id: nil) }
  scope :by_level, ->(level) { where(level: levels[level]) }
  scope :ordered, -> { order(:position, :name) }
  scope :for_course, ->(course) { where(course_id: course.id) }

  # Plural scopes for convenience (enum generates singular scopes)
  scope :courses, -> { where(level: :course) }
  scope :parts, -> { where(level: :part) }
  scope :units, -> { where(level: :unit) }
  scope :topics, -> { where(level: :topic) }

  # Methods
  def ancestors
    node = self
    ancestors = []
    visited = Set.new([id])
    while node.parent
      node = node.parent
      # Prevent infinite loop on circular references
      break if visited.include?(node.id)

      visited.add(node.id)
      ancestors.unshift(node)
    end
    ancestors
  end

  def descendants
    result = []
    children.each do |child|
      result << child
      result.concat(child.descendants)
    end
    result
  end

  def path_identifier
    "#{uuid}-x:#{slug}"
  end

  def self.find_by_param(param)
    uuid = param.to_s.split("-x:").first
    find_by(uuid: uuid) || find_by(slug: param) || find_by(id: param)
  end

  private

  def generate_uuid
    self.uuid ||= SecureRandom.uuid
  end

  def generate_slug
    return if slug.present?

    prefix = "#{level}-"
    base_slug = name.to_s.parameterize
    self.slug = "#{prefix}#{base_slug}"

    counter = 1
    while TaxonomyNode.exists?(slug: slug)
      self.slug = "#{prefix}#{base_slug}-#{counter}"
      counter += 1
    end
  end

  def slug_prefix_matches_level
    return unless slug.present? && level.present?

    expected_prefix = "#{level}-"
    return if slug.start_with?(expected_prefix)

    errors.add(:slug, "must start with '#{expected_prefix}' for #{level} level")
  end

  def no_circular_references
    return if parent_id.blank?
    return if parent_id == id && errors.add(:parent, "cannot be self")

    # Check for circular references by traversing up the parent chain
    node = parent
    visited = Set.new([id])
    while node
      if visited.include?(node.id)
        errors.add(:parent, "would create a circular reference")
        return
      end
      visited.add(node.id)
      node = node.parent
    end
  end

  def intra_course_uniqueness
    return unless topic? && course_id.present?

    existing = TaxonomyNode.where(course_id: course_id, level: :topic)
                           .where.not(id: id)
                           .where("LOWER(name) = LOWER(?)", name)

    errors.add(:base, "Topic with this name already exists in this course") if existing.exists?
  end
end
