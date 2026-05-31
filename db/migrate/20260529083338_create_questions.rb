class CreateQuestions < ActiveRecord::Migration[7.2]
  def change
    create_table :questions do |t|
      t.string :question_id_code
      t.jsonb :config_data

      t.timestamps
    end
  end
end
