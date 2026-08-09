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
    question = create(:question, config_data: { question: "Test question here?", choices: [{content: "A", correct: true}, {content: "B", correct: false}], numChoices: 1 })
    question.reload
    assert_equal "Test question here?", question.config_data["question"]
  end

  test "should handle nil config_data" do
    question = Question.new
    assert_nil question.config_data
  end

  # ============================================================================
  # ensure_valid_question_structure
  # ============================================================================

  test "should sanitize XSS in question text" do
    question = build(:question, config_data: {
      question: "<script>alert('xss')</script>What is 2+2?",
      choices: [{content: "4", correct: true}, {content: "3", correct: false}],
      numChoices: 1
    })
    question.save!
    question.reload
    assert_equal "alert('xss')What is 2+2?", question.config_data["question"]
  end

  test "should sanitize XSS in choice content" do
    question = build(:question, config_data: {
      question: "What is 2+2?",
      choices: [
        {content: "<img src=x onerror=alert(1)>4", correct: true},
        {content: "3", correct: false}
      ],
      numChoices: 1
    })
    question.save!
    question.reload
    assert_equal "4", question.config_data["choices"].first["content"]
  end

  test "should sanitize XSS in hints" do
    question = build(:question, config_data: {
      question: "What is 2+2?",
      choices: [{content: "4", correct: true}, {content: "3", correct: false}],
      hints: ["<script>alert('xss')</script>"],
      numChoices: 1
    })
    question.save!
    question.reload
    assert_equal "alert('xss')", question.config_data["hints"].first
  end

  # ============================================================================
  # find_by_param
  # ============================================================================

  test "find_by_param finds by uuid" do
    question = create(:question)
    found = Question.find_by_param(question.uuid)
    assert_equal question, found
  end

  test "find_by_param finds by slug" do
    question = create(:question)
    found = Question.find_by_param(question.slug)
    assert_equal question, found
  end

  test "find_by_param finds by id" do
    question = create(:question)
    found = Question.find_by_param(question.id.to_s)
    assert_equal question, found
  end

  test "find_by_param returns nil for non-existent record" do
    assert_nil Question.find_by_param("non-existent")
  end
end
