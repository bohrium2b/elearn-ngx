class Exercise < ApplicationRecord
  before_validation :ensure_uuid, on: :create
  before_validation :generate_slug, on: :create

  validates :title, presence: true
  validates :slug, presence: true, uniqueness: true
  validate :spec_structure
  validate :over_selection_boundary_guard
  validate :exclusive_family_overlap_guard

  # Scope to exclude practice exercises from regular listings
  scope :regular, -> { where(is_practice: false) }
  scope :practice, -> { where(is_practice: true) }

  # Find by UUID, slug, ID, or combined format (<uuid>-x:<slug>)
  # Priority: combined format > UUID > numeric ID > slug
  def self.find_by_uuid_or_slug_or_id(param)
    return nil if param.blank?

    # Check if it's a combined format: <uuid>-x:<slug> (e.g., "abc12345-...-1:exercise-algebra")
    # This matches the format used by questions and tags
    combined_match = param.match(/\A([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})-(\d+):(.+)\z/i)
    if combined_match
      find_by(uuid: combined_match[1])
    # Check if it's a UUID format (8-4-4-4-12 hex format)
    elsif param.match?(/\A[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\z/i)
      find_by(uuid: param)
    # Check if it's a numeric ID (digits only)
    elsif param.match?(/\A\d+\z/)
      find_by(id: param)
    # Otherwise treat as slug
    else
      find_by(slug: param)
    end
  end

  # Generate a URL-friendly slug from the title
  def generate_slug
    return if slug.present? || title.blank?

    base_slug = title.parameterize
    base_slug = "exercise-#{id}" if base_slug.blank?
    
    unique_slug = base_slug
    counter = 1

    # Ensure uniqueness
    while Exercise.exists?(slug: unique_slug)
      unique_slug = "#{base_slug}-#{counter}"
      counter += 1
    end

    self.slug = unique_slug
  end

  # Update slug if title changes
  def should_generate_new_slug?
    title_changed? && slug.blank?
  end

  def practice?
    is_practice == true
  end

  private

  def spec_structure
    return if spec.blank?

    unless spec.is_a?(Hash) && spec["selection_rules"].is_a?(Array)
      errors.add(:spec, "must contain an array of 'selection_rules'")
      return
    end

    spec["selection_rules"].each do |rule|
      unless rule.is_a?(Hash)
        errors.add(:spec, "selection rule must be a hash")
        next
      end

      case rule["type"]
      when "dynamic_tag"
        unless rule["tag_uuid"].present? && rule["count"].is_a?(Integer) && rule["count"] > 0 && rule["strategy"] == "random"
          errors.add(:spec, "dynamic_tag rule is invalid: #{rule.inspect}")
        end
      when "static_question"
        errors.add(:spec, "static_question rule is invalid: #{rule.inspect}") unless rule["question_uuid"].present?
      else
        errors.add(:spec, "unknown selection rule type: #{rule['type']}")
      end
    end
  end

  def over_selection_boundary_guard
    return if spec.blank? || !spec["selection_rules"].is_a?(Array)

    spec["selection_rules"].each do |rule|
      next unless rule["type"] == "dynamic_tag"

      tag = Tag.find_by(uuid: rule["tag_uuid"])
      if tag
        total_available_questions = tag.total_questions_in_branch
        if rule["count"] > total_available_questions
          errors.add(:spec,
                     "Requested #{rule['count']} questions from '#{tag.name}', but it only has #{total_available_questions} available.")
        end
      else
        errors.add(:spec, "Tag with UUID #{rule['tag_uuid']} not found for dynamic_tag rule.")
      end
    end
  end

  def exclusive_family_overlap_guard
    return if spec.blank? || !spec["selection_rules"].is_a?(Array)

    dynamic_tag_rules = spec["selection_rules"].select { |r| r["type"] == "dynamic_tag" }

    # Store tags and their ancestors for quick lookup
    rule_tags_with_ancestors = {}

    dynamic_tag_rules.each do |rule|
      tag = Tag.find_by(uuid: rule["tag_uuid"])
      if tag
        rule_tags_with_ancestors[tag.uuid] = {
          tag: tag,
          ancestors: tag.all_descendants
        }
      else
        errors.add(:spec, "Tag with UUID #{rule['tag_uuid']} not found for exclusive family overlap guard.")
      end
    end

    dynamic_tag_rules.each do |rule1|
      tag1_info = rule_tags_with_ancestors[rule1["tag_uuid"]]
      next unless tag1_info # Skip if tag1 was not found

      dynamic_tag_rules.each do |rule2|
        next if rule1 == rule2 # Don't compare a rule with itself

        tag2_info = rule_tags_with_ancestors[rule2["tag_uuid"]]
        next unless tag2_info # Skip if tag2 was not found

        tag1 = tag1_info[:tag]
        tag2 = tag2_info[:tag]

        if tag1.is_ancestor_of?(tag2) || tag2.is_ancestor_of?(tag1)
          errors.add(:spec,
                     "Exercise cannot contain rules selecting both '#{tag1.name}' and '#{tag2.name}' due to family overlap.")
        end
      end
    end
  end

  def ensure_uuid
    self.uuid ||= SecureRandom.uuid
  end
end
