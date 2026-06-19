# frozen_string_literal: true

class TopicTag < ApplicationRecord
  belongs_to :taxonomy_node
  belongs_to :tag

  validates :tag_id, uniqueness: { scope: :taxonomy_node_id }

  # Ensure the taxonomy_node is a topic
  validate :taxonomy_node_must_be_topic

  private

  def taxonomy_node_must_be_topic
    return unless taxonomy_node

    return if taxonomy_node.topic?

    errors.add(:taxonomy_node, "must be a topic")
  end
end
