class CreateTopicTags < ActiveRecord::Migration[7.2]
  def change
    create_table :topic_tags do |t|
      t.references :taxonomy_node, null: false, foreign_key: true
      t.references :tag, null: false, foreign_key: true

      t.timestamps
    end

    add_index :topic_tags, [:taxonomy_node_id, :tag_id], unique: true, name: 'index_topic_tags_on_node_and_tag'
  end
end
