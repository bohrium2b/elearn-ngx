class CreateAssessmentSessions < ActiveRecord::Migration[7.2]
  def change
    create_table :assessment_sessions do |t|
      t.references :user, null: false, foreign_key: true
      t.references :exercise, null: false, foreign_key: true
      t.decimal :score_percentage, precision: 5, scale: 2
      t.integer :duration_seconds
      t.datetime :completed_at, null: false
      t.jsonb :telemetry_data, null: false, default: {}

      t.timestamps
    end

    add_index :assessment_sessions, :completed_at
    add_index :assessment_sessions, [:user_id, :exercise_id]
    add_index :assessment_sessions, :telemetry_data, using: :gin
  end
end
