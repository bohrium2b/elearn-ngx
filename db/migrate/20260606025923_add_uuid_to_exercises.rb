class AddUuidToExercises < ActiveRecord::Migration[7.2]
  def change
    add_column :exercises, :uuid, :uuid, default: "gen_random_uuid()", null: false
    add_index :exercises, :uuid, unique: true
  end
end
