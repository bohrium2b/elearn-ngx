require 'securerandom'

class BackfillQuestionUuidsAndSlugs < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  class MigrationQuestion < ActiveRecord::Base
    self.table_name = 'questions'
  end

  def up
    say_with_time "Backfilling UUIDs and slugs for questions" do
      MigrationQuestion.reset_column_information

      MigrationQuestion.find_each do |q|
        if q.uuid.blank?
          q.update_columns(uuid: SecureRandom.uuid)
        end

        next if q.slug.present?

        base = q.respond_to?(:title) ? q.title.to_s.parameterize : nil
        candidate = base.presence || "question-#{q.id}"
        suffix = 0
        while MigrationQuestion.where(slug: candidate).where.not(id: q.id).exists?
          suffix += 1
          candidate = "#{base}-#{suffix}"
        end
        q.update_columns(slug: candidate)
      end
    end
  end

  def down
    say_with_time "Clearing UUIDs and slugs on rollback" do
      MigrationQuestion.update_all(uuid: nil, slug: nil)
    end
  end
end
