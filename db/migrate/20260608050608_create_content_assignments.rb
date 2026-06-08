# frozen_string_literal: true

class CreateContentAssignments < ActiveRecord::Migration[7.2]
  def change
    create_table :content_assignments do |t|
      t.references :taxonomy_node, null: false, foreign_key: true
      t.references :question, null: false, foreign_key: true
      t.integer :position, default: 0

      t.timestamps
    end

    add_index :content_assignments, [:taxonomy_node_id, :question_id], unique: true, name: 'index_content_assignments_on_node_and_question'
    add_index :content_assignments, [:taxonomy_node_id, :position]
  end
end
