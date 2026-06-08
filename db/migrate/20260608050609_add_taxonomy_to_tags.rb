# frozen_string_literal: true

class AddTaxonomyToTags < ActiveRecord::Migration[7.2]
  def change
    add_reference :tags, :taxonomy_node, foreign_key: true, null: true
  end
end
