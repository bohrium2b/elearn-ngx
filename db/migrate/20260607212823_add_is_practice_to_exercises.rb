class AddIsPracticeToExercises < ActiveRecord::Migration[7.2]
  def change
    add_column :exercises, :is_practice, :boolean, default: false, null: false
    add_index :exercises, :is_practice
  end
end
