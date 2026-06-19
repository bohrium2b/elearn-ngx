# frozen_string_literal: true

Rails.logger.debug "Creating topic-tag and topic-exercise associations..."

# Get some existing topics
topics = TaxonomyNode.topics.limit(5)
if topics.empty?
  Rails.logger.debug "No topics found. Please run taxonomy seeds first."
  return
end

# Get some existing tags
tags = Tag.limit(5)
if tags.empty?
  Rails.logger.debug "No tags found. Please run tag seeds first."
  return
end

# Get some existing exercises
exercises = Exercise.limit(5)
if exercises.empty?
  Rails.logger.debug "No exercises found. Please run exercise seeds first."
  return
end

# Attach tags to topics
topics.each_with_index do |topic, index|
  # Attach 1-2 tags per topic
  tag = tags[index % tags.length]
  TopicTag.find_or_create_by!(taxonomy_node: topic, tag: tag)
  Rails.logger.debug { "Attached tag '#{tag.name}' to topic '#{topic.name}'" }

  # Attach exercises to topics
  exercise = exercises[index % exercises.length]
  TopicExercise.find_or_create_by!(taxonomy_node: topic, exercise: exercise)
  Rails.logger.debug { "Attached exercise '#{exercise.title}' to topic '#{topic.name}'" }
end

Rails.logger.debug { "Created #{TopicTag.count} topic-tag associations" }
Rails.logger.debug { "Created #{TopicExercise.count} topic-exercise associations" }
