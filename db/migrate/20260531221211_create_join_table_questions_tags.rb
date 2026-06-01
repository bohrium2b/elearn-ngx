class CreateJoinTableQuestionsTags < ActiveRecord::Migration[7.2]
  def change
    create_join_table :questions, :tags do |t|
      t.index [:question_id, :tag_id], unique: true
      t.index [:tag_id, :question_id]
    end
  end
end
