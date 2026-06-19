class CreateTopicExercises < ActiveRecord::Migration[7.2]
  def change
    create_table :topic_exercises do |t|
      t.references :taxonomy_node, null: false, foreign_key: true
      t.references :exercise, null: false, foreign_key: true
      t.integer :position, default: 0

      t.timestamps
    end

    add_index :topic_exercises, [:taxonomy_node_id, :exercise_id], unique: true, name: 'index_topic_exercises_on_node_and_exercise'
    add_index :topic_exercises, [:taxonomy_node_id, :position]
  end
end
