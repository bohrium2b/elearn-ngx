class Exercise < ApplicationRecord
  validates :title, presence: true
  validate :spec_structure
  validate :over_selection_boundary_guard
  validate :exclusive_family_overlap_guard

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
end
