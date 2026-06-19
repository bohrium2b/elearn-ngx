class AddTopicToAssessmentSessions < ActiveRecord::Migration[7.2]
  def change
    add_reference :assessment_sessions, :taxonomy_node, foreign_key: true, null: true
  end
end
