# frozen_string_literal: true

class ContentAssignment < ApplicationRecord
  belongs_to :taxonomy_node
  belongs_to :question

  validates :taxonomy_node, presence: true
  validates :question, presence: true
  validates :question_id, uniqueness: { scope: :taxonomy_node_id }

  scope :ordered, -> { order(:position) }
end
