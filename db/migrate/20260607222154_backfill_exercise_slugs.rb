class BackfillExerciseSlugs < ActiveRecord::Migration[7.2]
  def up
    Exercise.where(slug: [nil, '']).find_each do |exercise|
      # Generate slug from title
      base_slug = exercise.title.to_s.parameterize
      base_slug = "exercise-#{exercise.id}" if base_slug.blank?
      
      # Ensure uniqueness
      unique_slug = base_slug
      counter = 1
      while Exercise.where(slug: unique_slug).where.not(id: exercise.id).exists?
        unique_slug = "#{base_slug}-#{counter}"
        counter += 1
      end
      
      exercise.update_column(:slug, unique_slug)
    end
  end

  def down
    # No need to rollback
  end
end
