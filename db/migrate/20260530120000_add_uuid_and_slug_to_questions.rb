class AddUuidAndSlugToQuestions < ActiveRecord::Migration[7.0]
  def change
    enable_extension 'pgcrypto' unless extension_enabled?('pgcrypto')

    add_column :questions, :uuid, :uuid, default: -> { "gen_random_uuid()" }, null: false
    add_column :questions, :slug, :string

    add_index :questions, :uuid, unique: true
    add_index :questions, :slug, unique: true
  end
end
