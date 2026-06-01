class CreateTags < ActiveRecord::Migration[7.2]
  def change
    create_table :tags do |t|
      t.string :name, null: false
      t.string :slug, null: false
      t.uuid :uuid, default: "gen_random_uuid()", null: false, index: { unique: true }
      t.integer :parent_id, index: true
      t.string :color, null: false 

      t.timestamps
    end

    # Foreign key pointing back to same table
    add_foreign_key :tags, :tags, column: :parent_id, primary_key: :id
  end
end
