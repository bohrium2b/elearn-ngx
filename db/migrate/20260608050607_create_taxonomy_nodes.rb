# frozen_string_literal: true

class CreateTaxonomyNodes < ActiveRecord::Migration[7.2]
  def change
    create_table :taxonomy_nodes do |t|
      t.string :name, null: false
      t.string :slug, null: false
      t.uuid :uuid, null: false, default: 'gen_random_uuid()'
      t.integer :level, null: false, default: 0 # enum: course, part, unit, topic
      t.references :parent, foreign_key: { to_table: :taxonomy_nodes }
      t.references :course, foreign_key: { to_table: :taxonomy_nodes }
      t.integer :position, default: 0
      t.jsonb :metadata, default: {}
      t.text :description

      t.timestamps
    end

    add_index :taxonomy_nodes, :uuid, unique: true
    add_index :taxonomy_nodes, :slug, unique: true
    add_index :taxonomy_nodes, :level
    add_index :taxonomy_nodes, [:parent_id, :position]
    add_index :taxonomy_nodes, [:course_id, :level, :position]
  end
end
