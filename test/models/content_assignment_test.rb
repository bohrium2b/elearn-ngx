# frozen_string_literal: true

require "test_helper"

class ContentAssignmentTest < ActiveSupport::TestCase
  # ============================================================================
  # Validations
  # ============================================================================

  test "should be valid with valid attributes" do
    node = create(:taxonomy_node, :topic)
    question = create(:question)
    assignment = build(:content_assignment, taxonomy_node: node, question: question)
    assert assignment.valid?
  end

  test "should require unique question_id scoped to taxonomy_node_id" do
    node = create(:taxonomy_node, :topic)
    question = create(:question)
    create(:content_assignment, taxonomy_node: node, question: question)

    duplicate = build(:content_assignment, taxonomy_node: node, question: question)
    assert_not duplicate.valid?
    assert_includes duplicate.errors[:question_id], "has already been taken"
  end

  test "should allow same question in different taxonomy_nodes" do
    node1 = create(:taxonomy_node, :topic)
    node2 = create(:taxonomy_node, :topic)
    question = create(:question)

    create(:content_assignment, taxonomy_node: node1, question: question)
    assignment2 = build(:content_assignment, taxonomy_node: node2, question: question)

    assert assignment2.valid?
  end

  # ============================================================================
  # Associations
  # ============================================================================

  test "should belong to taxonomy_node" do
    node = create(:taxonomy_node, :topic)
    assignment = create(:content_assignment, taxonomy_node: node)
    assert_equal node, assignment.taxonomy_node
  end

  test "should belong to question" do
    question = create(:question)
    assignment = create(:content_assignment, question: question)
    assert_equal question, assignment.question
  end

  # ============================================================================
  # Scopes
  # ============================================================================

  test "ordered scope orders by position" do
    node = create(:taxonomy_node, :topic)
    question1 = create(:question)
    question2 = create(:question)

    ca1 = create(:content_assignment, taxonomy_node: node, question: question1, position: 2)
    ca2 = create(:content_assignment, taxonomy_node: node, question: question2, position: 1)

    ordered = ContentAssignment.ordered
    assert_equal ca2, ordered.first
    assert_equal ca1, ordered.last
  end
end
