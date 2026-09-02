# frozen_string_literal: true

class TopicExerciseBuilder
  MAX_DYNAMIC_PER_TAG = 5

  def initialize(taxonomy_node)
    @taxonomy_node = taxonomy_node
  end

  def build_spec
    {
      "description" => "Topic Play: #{@taxonomy_node.name}",
      "selection_rules" => build_selection_rules
    }
  end

  def build_exercise
    Exercise.create!(
      title: "Topic Play: #{@taxonomy_node.name} — #{Time.zone.today}",
      spec: build_spec,
      is_practice: true,
      primary_topic: @taxonomy_node
    )
  end

  private

  def build_selection_rules
    rules = @taxonomy_node.questions.map do |question|
      static_question_rule(question)
    end

    @taxonomy_node.topic_tags.includes(:tag).find_each do |topic_tag|
      tag = topic_tag.tag
      next unless tag

      available = tag.all_descendants.flat_map(&:questions).uniq.count + tag.questions.count
      count = [available, MAX_DYNAMIC_PER_TAG].min
      next if count <= 0

      rules << dynamic_tag_rule(tag, count)
    end

    rules
  end

  def static_question_rule(question)
    {
      "type" => "static_question",
      "question_uuid" => question.uuid
    }
  end

  def dynamic_tag_rule(tag, count)
    {
      "type" => "dynamic_tag",
      "tag_uuid" => tag.uuid,
      "count" => count,
      "strategy" => "random"
    }
  end
end
