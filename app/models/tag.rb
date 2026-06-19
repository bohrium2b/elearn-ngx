# frozen_string_literal: true

class Tag < ApplicationRecord
  before_validation :ensure_uuid, on: :create
  before_validation :generate_slug, :assign_random_color, on: :create
  before_destroy :detach_questions

  belongs_to :parent, class_name: "Tag", optional: true
  belongs_to :taxonomy_node, optional: true
  has_many :children, class_name: "Tag", foreign_key: "parent_id", dependent: :destroy, inverse_of: :parent
  has_and_belongs_to_many :questions
  has_many :topic_tags, dependent: :destroy
  has_many :topics, through: :topic_tags, source: :taxonomy_node

  validates :name, presence: true
  validates :slug, presence: true, format: { with: /\Atag-[a-z0-9-]+\z/ }
  validates :uuid, presence: true, uniqueness: true
  validates :color, presence: true
  validate :parent_must_not_create_cycle

  def to_param
    "#{uuid}-x:#{slug.sub('tag-', '')}"
  end

  def all_descendants
    children.flat_map { |child| [child] + child.all_descendants }
  end

  def total_questions_in_branch
    (questions + all_descendants.flat_map(&:questions)).uniq.count
  end

  def ancestor_of?(other_tag)
    return false if other_tag.nil?

    current_parent = other_tag.parent
    while current_parent
      return true if current_parent == self

      current_parent = current_parent.parent
    end
    false
  end

  # Keep backward compatibility
  alias is_ancestor_of? ancestor_of?

  private

  def ensure_uuid
    self.uuid ||= SecureRandom.uuid
  end

  def generate_slug
    return if name.blank? || slug.present?

    self.slug = "tag-#{name.parameterize}"
  end

  def assign_random_color
    return if color.present?

    self.color = "##{SecureRandom.hex(3)}"
  end

  def parent_must_not_create_cycle
    return if parent_id.blank?

    if parent_id == id
      errors.add(:parent, "cannot be the tag itself")
      return
    end

    current_parent = parent
    visited_ids = [id].compact

    while current_parent
      if visited_ids.include?(current_parent.id)
        errors.add(:parent, "cannot be a descendant of the tag")
        break
      end

      visited_ids << current_parent.id
      current_parent = current_parent.parent
    end
  end

  def detach_questions
    questions.clear
  end
end
