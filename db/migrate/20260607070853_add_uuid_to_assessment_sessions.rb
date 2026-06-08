class AddUuidToAssessmentSessions < ActiveRecord::Migration[7.2]
  def change
    add_column :assessment_sessions, :uuid, :uuid, default: "gen_random_uuid()", null: false
    add_index :assessment_sessions, :uuid, unique: true
  end
end
