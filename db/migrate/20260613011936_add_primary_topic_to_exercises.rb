class AddPrimaryTopicToExercises < ActiveRecord::Migration[7.2]
  def change
    add_reference :exercises, :primary_topic, foreign_key: { to_table: :taxonomy_nodes }, null: true
  end
end
