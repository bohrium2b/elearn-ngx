# frozen_string_literal: true

require "test_helper"

class TopicTagTest < ActiveSupport::TestCase
  # ============================================================================
  # Validations
  # ============================================================================

  test "should be valid with valid attributes" do
    topic = create(:taxonomy_node, :topic)
    tag = create(:tag)
    topic_tag = build(:topic_tag, taxonomy_node: topic, tag: tag)
    assert topic_tag.valid?
  end

  test "should require unique tag_id scoped to taxonomy_node_id" do
    topic = create(:taxonomy_node, :topic)
    tag = create(:tag)
    create(:topic_tag, taxonomy_node: topic, tag: tag)

    duplicate = build(:topic_tag, taxonomy_node: topic, tag: tag)
    assert_not duplicate.valid?
    assert_includes duplicate.errors[:tag_id], "has already been taken"
  end

  test "should allow same tag in different topics" do
    topic1 = create(:taxonomy_node, :topic)
    topic2 = create(:taxonomy_node, :topic)
    tag = create(:tag)

    create(:topic_tag, taxonomy_node: topic1, tag: tag)
    topic_tag2 = build(:topic_tag, taxonomy_node: topic2, tag: tag)

    assert topic_tag2.valid?
  end

  test "should require taxonomy_node to be a topic" do
    course = create(:taxonomy_node, :course)
    tag = create(:tag)
    topic_tag = build(:topic_tag, taxonomy_node: course, tag: tag)

    assert_not topic_tag.valid?
    assert_includes topic_tag.errors[:taxonomy_node], "must be a topic"
  end

  test "should require taxonomy_node to be a topic (part)" do
    part = create(:taxonomy_node, :part)
    tag = create(:tag)
    topic_tag = build(:topic_tag, taxonomy_node: part, tag: tag)

    assert_not topic_tag.valid?
    assert_includes topic_tag.errors[:taxonomy_node], "must be a topic"
  end

  test "should require taxonomy_node to be a topic (unit)" do
    unit = create(:taxonomy_node, :unit)
    tag = create(:tag)
    topic_tag = build(:topic_tag, taxonomy_node: unit, tag: tag)

    assert_not topic_tag.valid?
    assert_includes topic_tag.errors[:taxonomy_node], "must be a topic"
  end

  test "should accept valid topic taxonomy_node" do
    topic = create(:taxonomy_node, :topic)
    tag = create(:tag)
    topic_tag = build(:topic_tag, taxonomy_node: topic, tag: tag)

    assert topic_tag.valid?
  end

  # ============================================================================
  # Associations
  # ============================================================================

  test "should belong to taxonomy_node" do
    topic = create(:taxonomy_node, :topic)
    topic_tag = create(:topic_tag, taxonomy_node: topic)
    assert_equal topic, topic_tag.taxonomy_node
  end

  test "should belong to tag" do
    tag = create(:tag)
    topic_tag = create(:topic_tag, tag: tag)
    assert_equal tag, topic_tag.tag
  end

  # ============================================================================
  # Edge Cases
  # ============================================================================

  test "should handle nil taxonomy_node gracefully" do
    tag = create(:tag)
    topic_tag = TopicTag.new(tag: tag, taxonomy_node: nil)

    # Should not raise error, just skip validation
    topic_tag.valid?
    assert_not topic_tag.errors[:taxonomy_node].include?("must be a topic")
  end
end
