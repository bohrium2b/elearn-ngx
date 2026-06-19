# frozen_string_literal: true

require "test_helper"

class TagTest < ActiveSupport::TestCase
  # ============================================================================
  # Validations
  # ============================================================================

  test "should be valid with valid attributes" do
    tag = build(:tag)
    assert tag.valid?
  end

  test "should require name" do
    tag = build(:tag, name: nil)
    assert_not tag.valid?
    assert_includes tag.errors[:name], "can't be blank"
  end

  test "should require slug" do
    tag = build(:tag, slug: nil)
    tag.valid? # Trigger slug generation
    assert tag.slug.present?
  end

  test "should require valid slug format" do
    tag = build(:tag, slug: "invalid-slug")
    assert_not tag.valid?
    assert_includes tag.errors[:slug], "is invalid"
  end

  test "should accept valid slug format" do
    tag = build(:tag, slug: "tag-valid-slug")
    tag.valid?
    assert_not tag.errors[:slug].include?("is invalid")
  end

  test "should require unique uuid" do
    tag1 = create(:tag)
    tag2 = build(:tag, uuid: tag1.uuid)
    assert_not tag2.valid?
    assert_includes tag2.errors[:uuid], "has already been taken"
  end

  test "should require color" do
    tag = build(:tag, color: nil)
    tag.valid? # Trigger color generation
    assert tag.color.present?
  end

  # ============================================================================
  # Associations
  # ============================================================================

  test "should belong to parent" do
    parent = create(:tag)
    child = create(:tag, parent: parent)
    assert_equal parent, child.parent
  end

  test "should have many children" do
    parent = create(:tag)
    child1 = create(:tag, parent: parent)
    child2 = create(:tag, parent: parent)

    assert_includes parent.children, child1
    assert_includes parent.children, child2
    assert_equal 2, parent.children.count
  end

  test "should destroy children when destroyed" do
    parent = create(:tag)
    create(:tag, parent: parent)

    assert_difference("Tag.count", -2) do
      parent.destroy
    end
  end

  test "should have and belong to many questions" do
    tag = create(:tag)
    question1 = create(:question)
    question2 = create(:question)

    tag.questions << question1
    tag.questions << question2

    assert_includes tag.questions, question1
    assert_includes tag.questions, question2
    assert_equal 2, tag.questions.count
  end

  test "should belong to taxonomy_node" do
    taxonomy_node = create(:taxonomy_node, :topic)
    tag = create(:tag, taxonomy_node: taxonomy_node)
    assert_equal taxonomy_node, tag.taxonomy_node
  end

  test "should have many topic_tags" do
    tag = create(:tag)
    topic = create(:taxonomy_node, :topic)
    TopicTag.create!(tag: tag, taxonomy_node: topic)

    assert_equal 1, tag.topic_tags.count
  end

  test "should have many topics through topic_tags" do
    tag = create(:tag)
    topic = create(:taxonomy_node, :topic)
    TopicTag.create!(tag: tag, taxonomy_node: topic)

    assert_includes tag.topics, topic
  end

  # ============================================================================
  # Callbacks
  # ============================================================================

  test "should auto-generate uuid on create" do
    tag = create(:tag)
    assert tag.uuid.present?
    assert_match(/\A[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\z/i, tag.uuid)
  end

  test "should auto-generate slug on create" do
    tag = create(:tag, name: "Test Tag", slug: nil)
    assert_equal "tag-test-tag", tag.slug
  end

  test "should auto-generate color on create" do
    tag = create(:tag, color: nil)
    assert tag.color.present?
    assert_match(/\A#[0-9a-f]{6}\z/, tag.color)
  end

  test "should not override existing uuid" do
    custom_uuid = SecureRandom.uuid
    tag = create(:tag, uuid: custom_uuid)
    assert_equal custom_uuid, tag.uuid
  end

  test "should not override existing slug" do
    tag = create(:tag, slug: "tag-custom-slug")
    assert_equal "tag-custom-slug", tag.slug
  end

  test "should not override existing color" do
    tag = create(:tag, color: "#ff0000")
    assert_equal "#ff0000", tag.color
  end

  # ============================================================================
  # Instance Methods
  # ============================================================================

  test "to_param returns uuid-x:slug format without tag- prefix" do
    tag = create(:tag, name: "Test Tag", slug: "tag-test-tag")
    expected = "#{tag.uuid}-x:test-tag"
    assert_equal expected, tag.to_param
  end

  test "all_descendants returns all nested children" do
    root = create(:tag)
    child1 = create(:tag, parent: root)
    child2 = create(:tag, parent: root)
    grandchild = create(:tag, parent: child1)

    descendants = root.all_descendants
    assert_includes descendants, child1
    assert_includes descendants, child2
    assert_includes descendants, grandchild
    assert_equal 3, descendants.count
  end

  test "all_descendants returns empty array for leaf tag" do
    tag = create(:tag)
    assert_empty tag.all_descendants
  end

  test "total_questions_in_branch counts questions from all descendants" do
    root = create(:tag)
    child = create(:tag, parent: root)

    q_root = create(:question)
    q_child = create(:question)

    root.questions << q_root
    child.questions << q_child

    assert_equal 2, root.total_questions_in_branch
  end

  test "total_questions_in_branch counts only own questions for leaf tag" do
    tag = create(:tag)
    q1 = create(:question)
    q2 = create(:question)
    tag.questions << q1
    tag.questions << q2

    assert_equal 2, tag.total_questions_in_branch
  end

  test "total_questions_in_branch returns empty for tag with no questions" do
    tag = create(:tag)
    assert_equal 0, tag.total_questions_in_branch
  end

  test "ancestor_of? returns true for direct parent" do
    parent = create(:tag)
    child = create(:tag, parent: parent)

    assert parent.ancestor_of?(child)
  end

  test "ancestor_of? returns true for grandparent" do
    grandparent = create(:tag)
    parent = create(:tag, parent: grandparent)
    child = create(:tag, parent: parent)

    assert grandparent.ancestor_of?(child)
  end

  test "ancestor_of? returns false for child" do
    parent = create(:tag)
    child = create(:tag, parent: parent)

    assert_not child.ancestor_of?(parent)
  end

  test "ancestor_of? returns false for unrelated tag" do
    tag1 = create(:tag)
    tag2 = create(:tag)

    assert_not tag1.ancestor_of?(tag2)
  end

  test "ancestor_of? returns false for nil" do
    tag = create(:tag)
    assert_not tag.ancestor_of?(nil)
  end

  test "is_ancestor_of? is an alias for ancestor_of?" do
    parent = create(:tag)
    child = create(:tag, parent: parent)

    assert parent.is_ancestor_of?(child)
  end

  # ============================================================================
  # Parent Cycle Validation
  # ============================================================================

  test "tag rejects itself as a parent" do
    tag = create(:tag)
    tag.parent = tag

    assert_not tag.valid?
    assert_includes tag.errors[:parent], "cannot be the tag itself"
  end

  test "tag rejects circular parents" do
    parent = create(:tag)
    child = create(:tag, parent: parent)

    parent.parent = child

    assert_not parent.valid?
    assert_includes parent.errors[:parent], "cannot be a descendant of the tag"
  end

  test "tag rejects deeply nested circular parents" do
    grandparent = create(:tag)
    parent = create(:tag, parent: grandparent)
    child = create(:tag, parent: parent)

    grandparent.parent = child

    assert_not grandparent.valid?
    assert_includes grandparent.errors[:parent], "cannot be a descendant of the tag"
  end

  test "tag accepts valid parent" do
    parent = create(:tag)
    child = build(:tag, parent: parent)

    assert child.valid?
  end

  test "tag accepts nil parent" do
    tag = build(:tag, parent: nil)
    assert tag.valid?
  end

  # ============================================================================
  # Destroy Behavior
  # ============================================================================

  test "destroying a tag clears question links" do
    tag = create(:tag)
    question = create(:question)
    tag.questions << question

    tag.destroy
    assert_empty question.reload.tags
  end

  test "destroying a tag destroys children" do
    parent = create(:tag)
    child = create(:tag, parent: parent)

    assert_difference("Tag.count", -2) do
      parent.destroy
    end

    assert_not Tag.exists?(parent.id)
    assert_not Tag.exists?(child.id)
  end

  test "destroying a tag does not destroy sibling tags" do
    parent = create(:tag)
    child1 = create(:tag, parent: parent)
    child2 = create(:tag, parent: parent)

    child1.destroy
    assert Tag.exists?(child2.id)
  end
end
