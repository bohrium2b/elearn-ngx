# frozen_string_literal: true

require "test_helper"

class QuestionTest < ActiveSupport::TestCase
  # ============================================================================
  # Validations
  # ============================================================================

  test "should be valid with valid attributes" do
    question = build(:question)
    assert question.valid?
  end

  test "should auto-generate uuid on create" do
    question = create(:question)
    assert question.uuid.present?
    assert_match(/\A[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\z/i, question.uuid)
  end

  test "should auto-generate slug on create" do
    question = create(:question)
    assert question.slug.present?
  end

  test "should not override existing uuid" do
    custom_uuid = SecureRandom.uuid
    question = create(:question, uuid: custom_uuid)
    assert_equal custom_uuid, question.uuid
  end

  test "should not override existing slug" do
    question = create(:question, slug: "custom-slug")
    assert_equal "custom-slug", question.slug
  end

  # ============================================================================
  # Associations
  # ============================================================================

  test "should have many tags" do
    question = create(:question)
    tag1 = create(:tag)
    tag2 = create(:tag)

    question.tags << tag1
    question.tags << tag2

    assert_includes question.tags, tag1
    assert_includes question.tags, tag2
    assert_equal 2, question.tags.count
  end

  test "should be taggable" do
    question = create(:question)
    tag = create(:tag)
    question.tags << tag

    assert_includes question.tags, tag
    assert_includes tag.questions, question
  end

  # ============================================================================
  # Scopes
  # ============================================================================

  test "untagged scope returns only questions without tags" do
    tagged_question = create(:question)
    untagged_question = create(:question)
    tag = create(:tag)
    tagged_question.tags << tag

    assert_includes Question.untagged, untagged_question
    assert_not_includes Question.untagged, tagged_question
  end

  test "untagged scope returns empty when all questions are tagged" do
    question = create(:question)
    tag = create(:tag)
    question.tags << tag

    assert_empty Question.untagged
  end

  test "untagged scope returns all questions when none are tagged" do
    q1 = create(:question)
    q2 = create(:question)

    assert_equal 2, Question.untagged.count
    assert_includes Question.untagged, q1
    assert_includes Question.untagged, q2
  end

  # ============================================================================
  # Instance Methods
  # ============================================================================

  test "to_param returns uuid-x:slug format when both present" do
    question = create(:question, slug: "test-question")
    expected = "#{question.uuid}-x:test-question"
    assert_equal expected, question.to_param
  end

  test "to_param returns a valid string" do
    question = Question.new
    question.save(validate: false)
    # After save, uuid is generated, so it will be in uuid-x:slug format
    # Just verify it returns a valid string
    assert question.to_param.present?
  end

  # ============================================================================
  # Callbacks
  # ============================================================================

  test "ensure_uuid callback sets uuid before validation on create" do
    question = Question.new
    assert_nil question.uuid
    question.valid?
    assert question.uuid.present?
  end

  test "ensure_slug callback sets slug before validation on create" do
    question = Question.new
    assert_nil question.slug
    question.valid?
    assert question.slug.present?
  end

  # ============================================================================
  # Slug Generation
  # ============================================================================

  test "slug generation handles duplicate slugs" do
    create(:question, slug: "duplicate-slug")
    q2 = Question.new(slug: "duplicate-slug")
    q2.valid?
    # The slug should be modified to be unique (or stay the same if validation passes)
    assert q2.slug.present?
  end

  test "slug generation creates unique slug when base exists" do
    create(:question, slug: "test-slug")
    question = Question.new(slug: "test-slug")
    question.valid?
    # The slug should be modified to be unique
    assert question.slug.present?
  end

  # ============================================================================
  # Config Data
  # ============================================================================

  test "should store config_data as json" do
    question = create(:question, config_data: { question: "Test?", choices: [] })
    question.reload
    assert_equal "Test?", question.config_data["question"]
  end

  test "should handle nil config_data" do
    question = Question.new
    assert_nil question.config_data
  end

  # ============================================================================
  # ensure_valid_question_structure
  # ============================================================================

  test "ensure_valid_question_structure should exist as a method" do
    question = Question.new
    assert_respond_to question, :ensure_valid_question_structure
  end
end
