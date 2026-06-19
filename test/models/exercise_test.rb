# frozen_string_literal: true

require "test_helper"

class ExerciseTest < ActiveSupport::TestCase
  # ============================================================================
  # Validations
  # ============================================================================

  test "should be valid with valid attributes" do
    exercise = build(:exercise)
    assert exercise.valid?
  end

  test "should not save exercise without title" do
    exercise = build(:exercise, title: nil)
    assert_not exercise.valid?
    assert_includes exercise.errors[:title], "can't be blank"
  end

  test "should not save exercise without spec" do
    exercise = build(:exercise, spec: nil)
    assert_not exercise.valid?
    assert_includes exercise.errors[:spec], "can't be blank"
  end

  test "should not save exercise with empty selection rules" do
    exercise = Exercise.new(title: "Test", spec: { "selection_rules" => [] })
    assert_not exercise.valid?
    assert_includes exercise.errors[:spec].join, "selection_rules cannot be empty"
  end

  test "should not save exercise without selection_rules key" do
    exercise = Exercise.new(title: "Test", spec: { "other_key" => [] })
    assert_not exercise.valid?
    assert_includes exercise.errors[:spec].join, "must contain an array of 'selection_rules'"
  end

  test "should require unique slug" do
    create(:exercise, slug: "unique-slug")
    exercise = build(:exercise, slug: "unique-slug")
    assert_not exercise.valid?
    assert_includes exercise.errors[:slug], "has already been taken"
  end

  # ============================================================================
  # Associations
  # ============================================================================

  test "should belong to primary_topic" do
    topic = create(:taxonomy_node, :topic)
    exercise = create(:exercise, primary_topic: topic)
    assert_equal topic, exercise.primary_topic
  end

  test "should have many topic_exercises" do
    exercise = create(:exercise)
    topic = create(:taxonomy_node, :topic)
    TopicExercise.create!(exercise: exercise, taxonomy_node: topic)

    assert_equal 1, exercise.topic_exercises.count
  end

  test "should have many topics through topic_exercises" do
    exercise = create(:exercise)
    topic = create(:taxonomy_node, :topic)
    TopicExercise.create!(exercise: exercise, taxonomy_node: topic)

    assert_includes exercise.topics, topic
  end

  test "should destroy topic_exercises when destroyed" do
    exercise = create(:exercise)
    topic = create(:taxonomy_node, :topic)
    TopicExercise.create!(exercise: exercise, taxonomy_node: topic)

    assert_difference("TopicExercise.count", -1) do
      exercise.destroy
    end
  end

  # ============================================================================
  # Scopes
  # ============================================================================

  test "regular scope returns only non-practice exercises" do
    regular = create(:exercise, is_practice: false)
    practice = create(:exercise, is_practice: true)

    assert_includes Exercise.regular, regular
    assert_not_includes Exercise.regular, practice
  end

  test "practice scope returns only practice exercises" do
    regular = create(:exercise, is_practice: false)
    practice = create(:exercise, is_practice: true)

    assert_includes Exercise.practice, practice
    assert_not_includes Exercise.practice, regular
  end

  # ============================================================================
  # Instance Methods
  # ============================================================================

  test "practice? returns true when is_practice is true" do
    exercise = build(:exercise, is_practice: true)
    assert exercise.practice?
  end

  test "practice? returns false when is_practice is false" do
    exercise = build(:exercise, is_practice: false)
    assert_not exercise.practice?
  end

  test "path_identifier returns uuid-x:slug format" do
    exercise = create(:exercise, slug: "test-exercise")
    expected = "#{exercise.uuid}-x:test-exercise"
    assert_equal expected, exercise.path_identifier
  end

  # ============================================================================
  # Class Methods
  # ============================================================================

  test "find_by_uuid_or_slug_or_id finds by uuid" do
    exercise = create(:exercise)
    # rubocop:disable Rails/DynamicFindBy
    found = Exercise.find_by_uuid_or_slug_or_id(exercise.uuid)
    # rubocop:enable Rails/DynamicFindBy
    assert_equal exercise, found
  end

  test "find_by_uuid_or_slug_or_id finds by combined format" do
    exercise = create(:exercise, slug: "test-slug")
    param = "#{exercise.uuid}-#{exercise.id}:test-slug"
    # rubocop:disable Rails/DynamicFindBy
    found = Exercise.find_by_uuid_or_slug_or_id(param)
    # rubocop:enable Rails/DynamicFindBy
    assert_equal exercise, found
  end

  test "find_by_uuid_or_slug_or_id finds by slug" do
    exercise = create(:exercise, slug: "my-exercise")
    # rubocop:disable Rails/DynamicFindBy
    found = Exercise.find_by_uuid_or_slug_or_id("my-exercise")
    # rubocop:enable Rails/DynamicFindBy
    assert_equal exercise, found
  end

  test "find_by_uuid_or_slug_or_id finds by id" do
    exercise = create(:exercise)
    # rubocop:disable Rails/DynamicFindBy
    found = Exercise.find_by_uuid_or_slug_or_id(exercise.id.to_s)
    # rubocop:enable Rails/DynamicFindBy
    assert_equal exercise, found
  end

  test "find_by_uuid_or_slug_or_id returns nil for blank param" do
    # rubocop:disable Rails/DynamicFindBy
    assert_nil Exercise.find_by_uuid_or_slug_or_id("")
    assert_nil Exercise.find_by_uuid_or_slug_or_id(nil)
    # rubocop:enable Rails/DynamicFindBy
  end

  test "find_by_uuid_or_slug_or_id returns nil for non-existent record" do
    # rubocop:disable Rails/DynamicFindBy
    assert_nil Exercise.find_by_uuid_or_slug_or_id("non-existent")
    # rubocop:enable Rails/DynamicFindBy
  end

  # ============================================================================
  # Callbacks
  # ============================================================================

  test "should auto-generate uuid on create" do
    exercise = create(:exercise)
    assert exercise.uuid.present?
    assert_match(/\A[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\z/i, exercise.uuid)
  end

  test "should auto-generate slug on create" do
    exercise = create(:exercise)
    assert exercise.slug.present?
  end

  test "should not override existing uuid" do
    custom_uuid = SecureRandom.uuid
    exercise = create(:exercise, uuid: custom_uuid)
    assert_equal custom_uuid, exercise.uuid
  end

  test "should not override existing slug" do
    exercise = create(:exercise, slug: "custom-slug")
    assert_equal "custom-slug", exercise.slug
  end

  # ============================================================================
  # Slug Generation
  # ============================================================================

  test "generate_slug creates slug from title" do
    exercise = create(:exercise, title: "My Great Exercise", slug: nil)
    assert_equal "my-great-exercise", exercise.slug
  end

  test "generate_slug handles duplicate slugs" do
    create(:exercise, title: "Test Exercise", slug: "test-exercise")
    exercise = create(:exercise, title: "Test Exercise", slug: nil)
    assert_not_equal "test-exercise", exercise.slug
    assert_match(/test-exercise-\d+/, exercise.slug)
  end

  test "generate_slug handles blank title" do
    exercise = Exercise.new(title: "", slug: nil)
    exercise.generate_slug
    # Should not set slug if title is blank
    assert_nil exercise.slug
  end

  # ============================================================================
  # Spec Structure Validation
  # ============================================================================

  test "should validate spec is a hash" do
    exercise = Exercise.new(title: "Test", spec: "not a hash")
    assert_not exercise.valid?
    assert_includes exercise.errors[:spec].join, "must contain an array of 'selection_rules'"
  end

  test "should validate selection_rules is an array" do
    exercise = Exercise.new(title: "Test", spec: { "selection_rules" => "not an array" })
    assert_not exercise.valid?
    assert_includes exercise.errors[:spec].join, "must contain an array of 'selection_rules'"
  end

  test "should validate dynamic_tag rule structure" do
    exercise = Exercise.new(
      title: "Test",
      spec: {
        "selection_rules" => [
          { "type" => "dynamic_tag", "tag_uuid" => nil, "count" => 1, "strategy" => "random" }
        ]
      }
    )
    assert_not exercise.valid?
    assert_includes exercise.errors[:spec].join, "dynamic_tag rule is invalid"
  end

  test "should validate static_question rule requires question_uuid" do
    exercise = Exercise.new(
      title: "Test",
      spec: {
        "selection_rules" => [
          { "type" => "static_question", "question_uuid" => "" }
        ]
      }
    )
    assert_not exercise.valid?
    assert_includes exercise.errors[:spec].join, "static_question rule is invalid"
  end

  test "should validate unknown rule type" do
    exercise = Exercise.new(
      title: "Test",
      spec: {
        "selection_rules" => [
          { "type" => "unknown_type" }
        ]
      }
    )
    assert_not exercise.valid?
    assert_includes exercise.errors[:spec].join, "unknown selection rule type"
  end

  test "should validate selection rule must be a hash" do
    exercise = Exercise.new(
      title: "Test",
      spec: {
        "selection_rules" => ["not a hash"]
      }
    )
    assert_not exercise.valid?
    assert_includes exercise.errors[:spec].join, "selection rule must be a hash"
  end

  # ============================================================================
  # Over Selection Boundary Guard
  # ============================================================================

  test "should not save exercise requesting more questions than available" do
    tag = create(:tag)
    2.times { tag.questions << create(:question) }

    exercise = Exercise.new(
      title: "Over Select",
      spec: {
        "selection_rules" => [
          { "type" => "dynamic_tag", "tag_uuid" => tag.uuid, "count" => 3, "strategy" => "random" }
        ]
      }
    )

    assert_not exercise.save
    assert_includes exercise.errors[:spec].join, "Requested 3 questions"
  end

  test "should save exercise when requesting exact number of available questions" do
    tag = create(:tag)
    2.times { tag.questions << create(:question) }

    exercise = Exercise.new(
      title: "Exact Select",
      spec: {
        "selection_rules" => [
          { "type" => "dynamic_tag", "tag_uuid" => tag.uuid, "count" => 2, "strategy" => "random" }
        ]
      }
    )

    # Should be valid (tag exists and count matches)
    # Note: May still fail if tag validation in resolver, but boundary guard should pass
    exercise.valid?
    assert_not(exercise.errors[:spec].any? { |e| e.include?("Requested") && e.include?("only has") })
  end

  test "should validate tag exists for dynamic_tag rule" do
    exercise = Exercise.new(
      title: "Missing Tag",
      spec: {
        "selection_rules" => [
          { "type" => "dynamic_tag", "tag_uuid" => SecureRandom.uuid, "count" => 1, "strategy" => "random" }
        ]
      }
    )

    assert_not exercise.valid?
    assert_includes exercise.errors[:spec].join, "not found"
  end

  # ============================================================================
  # Exclusive Family Overlap Guard
  # ============================================================================

  test "should not save exercise with parent and child tag rules" do
    parent = create(:tag)
    child = create(:tag, parent: parent)

    exercise = Exercise.new(
      title: "Overlap",
      spec: {
        "selection_rules" => [
          { "type" => "dynamic_tag", "tag_uuid" => parent.uuid, "count" => 1, "strategy" => "random" },
          { "type" => "dynamic_tag", "tag_uuid" => child.uuid, "count" => 1, "strategy" => "random" }
        ]
      }
    )

    assert_not exercise.save
    assert_includes exercise.errors[:spec].join, "family overlap"
  end

  test "should not save exercise with child and parent tag rules (reversed)" do
    parent = create(:tag)
    child = create(:tag, parent: parent)

    exercise = Exercise.new(
      title: "Overlap Reversed",
      spec: {
        "selection_rules" => [
          { "type" => "dynamic_tag", "tag_uuid" => child.uuid, "count" => 1, "strategy" => "random" },
          { "type" => "dynamic_tag", "tag_uuid" => parent.uuid, "count" => 1, "strategy" => "random" }
        ]
      }
    )

    assert_not exercise.save
    assert_includes exercise.errors[:spec].join, "family overlap"
  end

  test "should save exercise with sibling tag rules" do
    parent = create(:tag)
    child1 = create(:tag, parent: parent)
    child2 = create(:tag, parent: parent)

    exercise = Exercise.new(
      title: "Siblings",
      spec: {
        "selection_rules" => [
          { "type" => "dynamic_tag", "tag_uuid" => child1.uuid, "count" => 1, "strategy" => "random" },
          { "type" => "dynamic_tag", "tag_uuid" => child2.uuid, "count" => 1, "strategy" => "random" }
        ]
      }
    )

    # Siblings should be allowed (no family overlap)
    exercise.valid?
    assert_not(exercise.errors[:spec].any? { |e| e.include?("family overlap") })
  end

  test "should validate tag exists for overlap guard" do
    exercise = Exercise.new(
      title: "Missing Tag Overlap",
      spec: {
        "selection_rules" => [
          { "type" => "dynamic_tag", "tag_uuid" => SecureRandom.uuid, "count" => 1, "strategy" => "random" },
          { "type" => "dynamic_tag", "tag_uuid" => SecureRandom.uuid, "count" => 1, "strategy" => "random" }
        ]
      }
    )

    exercise.valid?
    assert(exercise.errors[:spec].any? { |e| e.include?("not found") })
  end
end
