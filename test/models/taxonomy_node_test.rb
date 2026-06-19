# frozen_string_literal: true

require "test_helper"

class TaxonomyNodeTest < ActiveSupport::TestCase
  # ============================================================================
  # Enums
  # ============================================================================

  test "should define level enum" do
    node = build(:taxonomy_node)
    assert_respond_to node, :course?
    assert_respond_to node, :part?
    assert_respond_to node, :unit?
    assert_respond_to node, :topic?
  end

  test "should set correct level values" do
    assert_equal 0, TaxonomyNode.levels[:course]
    assert_equal 1, TaxonomyNode.levels[:part]
    assert_equal 2, TaxonomyNode.levels[:unit]
    assert_equal 3, TaxonomyNode.levels[:topic]
  end

  # ============================================================================
  # Validations
  # ============================================================================

  test "should be valid with valid attributes" do
    node = build(:taxonomy_node)
    assert node.valid?
  end

  test "should require name" do
    node = build(:taxonomy_node, name: nil)
    assert_not node.valid?
    assert_includes node.errors[:name], "can't be blank"
  end

  test "should require slug" do
    node = build(:taxonomy_node, slug: nil)
    node.valid? # Trigger slug generation
    assert node.slug.present?
  end

  test "should require unique slug" do
    create(:taxonomy_node, :course, slug: "course-unique-slug")
    node = build(:taxonomy_node, :course, slug: "course-unique-slug")
    assert_not node.valid?
    assert_includes node.errors[:slug], "has already been taken"
  end

  test "should require uuid" do
    node = build(:taxonomy_node, uuid: nil)
    node.valid? # Trigger uuid generation
    assert node.uuid.present?
  end

  test "should require unique uuid" do
    node1 = create(:taxonomy_node)
    node2 = build(:taxonomy_node, uuid: node1.uuid)
    assert_not node2.valid?
    assert_includes node2.errors[:uuid], "has already been taken"
  end

  test "should require level" do
    node = build(:taxonomy_node, level: nil)
    assert_not node.valid?
    assert_includes node.errors[:level], "can't be blank"
  end

  test "should validate slug prefix matches level" do
    node = build(:taxonomy_node, :course, slug: "topic-invalid")
    assert_not node.valid?
    assert_includes node.errors[:slug].join, "must start with 'course-'"
  end

  test "should accept valid slug prefix for course" do
    node = build(:taxonomy_node, :course, slug: "course-valid")
    node.valid?
    assert_not(node.errors[:slug].any? { |e| e.include?("must start with") })
  end

  test "should accept valid slug prefix for part" do
    node = build(:taxonomy_node, :part, slug: "part-valid")
    node.valid?
    assert_not(node.errors[:slug].any? { |e| e.include?("must start with") })
  end

  test "should accept valid slug prefix for unit" do
    node = build(:taxonomy_node, :unit, slug: "unit-valid")
    node.valid?
    assert_not(node.errors[:slug].any? { |e| e.include?("must start with") })
  end

  test "should accept valid slug prefix for topic" do
    node = build(:taxonomy_node, :topic, slug: "topic-valid")
    node.valid?
    assert_not(node.errors[:slug].any? { |e| e.include?("must start with") })
  end

  # ============================================================================
  # Associations
  # ============================================================================

  test "should belong to parent" do
    parent = create(:taxonomy_node, :course)
    child = create(:taxonomy_node, :part, parent: parent)
    assert_equal parent, child.parent
  end

  test "should belong to course" do
    course = create(:taxonomy_node, :course)
    topic = create(:taxonomy_node, :topic, course: course)
    assert_equal course, topic.course
  end

  test "should have many children" do
    parent = create(:taxonomy_node, :course)
    child1 = create(:taxonomy_node, :part, parent: parent)
    child2 = create(:taxonomy_node, :part, parent: parent)

    assert_includes parent.children, child1
    assert_includes parent.children, child2
    assert_equal 2, parent.children.count
  end

  test "should destroy children when destroyed" do
    parent = create(:taxonomy_node, :course)
    create(:taxonomy_node, :part, parent: parent)

    assert_difference("TaxonomyNode.count", -2) do
      parent.destroy
    end
  end

  test "should have many content_assignments" do
    node = create(:taxonomy_node, :topic)
    question = create(:question)
    ContentAssignment.create!(taxonomy_node: node, question: question)

    assert_equal 1, node.content_assignments.count
  end

  test "should have many questions through content_assignments" do
    node = create(:taxonomy_node, :topic)
    question = create(:question)
    ContentAssignment.create!(taxonomy_node: node, question: question)

    assert_includes node.questions, question
  end

  test "should have many tags" do
    node = create(:taxonomy_node, :topic)
    tag = create(:tag, taxonomy_node: node)

    assert_includes node.tags, tag
  end

  test "should nullify tags when destroyed" do
    node = create(:taxonomy_node, :topic)
    tag = create(:tag, taxonomy_node: node)

    node.destroy
    tag.reload
    assert_nil tag.taxonomy_node
  end

  test "should have many topic_tags" do
    node = create(:taxonomy_node, :topic)
    tag = create(:tag)
    TopicTag.create!(taxonomy_node: node, tag: tag)

    assert_equal 1, node.topic_tags.count
  end

  test "should destroy topic_tags when destroyed" do
    node = create(:taxonomy_node, :topic)
    tag = create(:tag)
    TopicTag.create!(taxonomy_node: node, tag: tag)

    assert_difference("TopicTag.count", -1) do
      node.destroy
    end
  end

  test "should have many topic_exercises" do
    node = create(:taxonomy_node, :topic)
    exercise = create(:exercise)
    TopicExercise.create!(taxonomy_node: node, exercise: exercise)

    assert_equal 1, node.topic_exercises.count
  end

  test "should destroy topic_exercises when destroyed" do
    node = create(:taxonomy_node, :topic)
    exercise = create(:exercise)
    TopicExercise.create!(taxonomy_node: node, exercise: exercise)

    assert_difference("TopicExercise.count", -1) do
      node.destroy
    end
  end

  test "should have many exercises through topic_exercises" do
    node = create(:taxonomy_node, :topic)
    exercise = create(:exercise)
    TopicExercise.create!(taxonomy_node: node, exercise: exercise)

    assert_includes node.exercises, exercise
  end

  test "should have many assessment_sessions" do
    node = create(:taxonomy_node, :topic)
    session = create(:assessment_session, taxonomy_node: node)

    assert_includes node.assessment_sessions, session
  end

  test "should nullify assessment_sessions when destroyed" do
    node = create(:taxonomy_node, :topic)
    session = create(:assessment_session, taxonomy_node: node)

    node.destroy
    session.reload
    assert_nil session.taxonomy_node
  end

  # ============================================================================
  # Scopes
  # ============================================================================

  test "roots scope returns nodes without parent" do
    root = create(:taxonomy_node, :course, parent: nil)
    child = create(:taxonomy_node, :part, parent: root)

    assert_includes TaxonomyNode.roots, root
    assert_not_includes TaxonomyNode.roots, child
  end

  test "by_level scope filters by level" do
    course = create(:taxonomy_node, :course)
    topic = create(:taxonomy_node, :topic)

    assert_includes TaxonomyNode.by_level(:course), course
    assert_not_includes TaxonomyNode.by_level(:course), topic
  end

  test "ordered scope orders by position and name" do
    node_b = create(:taxonomy_node, :course, position: 2, name: "B")
    node_a = create(:taxonomy_node, :course, position: 1, name: "A")

    ordered = TaxonomyNode.ordered
    assert_equal node_a, ordered.first
    assert_equal node_b, ordered.last
  end

  test "for_course scope filters by course" do
    course = create(:taxonomy_node, :course)
    topic1 = create(:taxonomy_node, :topic, course: course)
    topic2 = create(:taxonomy_node, :topic)

    assert_includes TaxonomyNode.for_course(course), topic1
    assert_not_includes TaxonomyNode.for_course(course), topic2
  end

  test "courses scope returns only courses" do
    course = create(:taxonomy_node, :course)
    topic = create(:taxonomy_node, :topic)

    assert_includes TaxonomyNode.courses, course
    assert_not_includes TaxonomyNode.courses, topic
  end

  test "parts scope returns only parts" do
    part = create(:taxonomy_node, :part)
    topic = create(:taxonomy_node, :topic)

    assert_includes TaxonomyNode.parts, part
    assert_not_includes TaxonomyNode.parts, topic
  end

  test "units scope returns only units" do
    unit = create(:taxonomy_node, :unit)
    topic = create(:taxonomy_node, :topic)

    assert_includes TaxonomyNode.units, unit
    assert_not_includes TaxonomyNode.units, topic
  end

  test "topics scope returns only topics" do
    topic = create(:taxonomy_node, :topic)
    course = create(:taxonomy_node, :course)

    assert_includes TaxonomyNode.topics, topic
    assert_not_includes TaxonomyNode.topics, course
  end

  # ============================================================================
  # Instance Methods
  # ============================================================================

  test "ancestors returns array of parent nodes" do
    course = create(:taxonomy_node, :course)
    part = create(:taxonomy_node, :part, parent: course)
    topic = create(:taxonomy_node, :topic, parent: part)

    ancestors = topic.ancestors
    assert_equal 2, ancestors.count
    assert_equal course, ancestors.first
    assert_equal part, ancestors.last
  end

  test "ancestors returns empty array for root node" do
    root = create(:taxonomy_node, :course)
    assert_empty root.ancestors
  end

  test "ancestors prevents infinite loop on circular references" do
    node1 = create(:taxonomy_node, :course)
    node2 = create(:taxonomy_node, :part, parent: node1)

    # Simulate circular reference (this shouldn't happen with validations)
    node1.parent_id = node2.id

    # ancestors should not cause infinite loop
    ancestors = node2.ancestors
    assert_kind_of Array, ancestors
  end

  test "descendants returns all nested children" do
    course = create(:taxonomy_node, :course)
    part = create(:taxonomy_node, :part, parent: course)
    topic = create(:taxonomy_node, :topic, parent: part)

    descendants = course.descendants
    assert_includes descendants, part
    assert_includes descendants, topic
    assert_equal 2, descendants.count
  end

  test "descendants returns empty array for leaf node" do
    node = create(:taxonomy_node, :topic)
    assert_empty node.descendants
  end

  test "path_identifier returns uuid-x:slug format" do
    node = create(:taxonomy_node, :course, slug: "course-test-node")
    expected = "#{node.uuid}-x:course-test-node"
    assert_equal expected, node.path_identifier
  end

  # ============================================================================
  # Class Methods
  # ============================================================================

  test "find_by_param finds by uuid" do
    node = create(:taxonomy_node)
    # rubocop:disable Rails/DynamicFindBy
    found = TaxonomyNode.find_by_param(node.uuid)
    # rubocop:enable Rails/DynamicFindBy
    assert_equal node, found
  end

  test "find_by_param finds by combined format" do
    node = create(:taxonomy_node, :course, slug: "course-test-slug")
    param = "#{node.uuid}-x:course-test-slug"
    # rubocop:disable Rails/DynamicFindBy
    found = TaxonomyNode.find_by_param(param)
    # rubocop:enable Rails/DynamicFindBy
    assert_equal node, found
  end

  test "find_by_param finds by slug" do
    node = create(:taxonomy_node, :course, slug: "course-my-node")
    # rubocop:disable Rails/DynamicFindBy
    found = TaxonomyNode.find_by_param("course-my-node")
    # rubocop:enable Rails/DynamicFindBy
    assert_equal node, found
  end

  test "find_by_param finds by id" do
    node = create(:taxonomy_node)
    # rubocop:disable Rails/DynamicFindBy
    found = TaxonomyNode.find_by_param(node.id.to_s)
    # rubocop:enable Rails/DynamicFindBy
    assert_equal node, found
  end

  # ============================================================================
  # Callbacks
  # ============================================================================

  test "should auto-generate uuid on create" do
    node = create(:taxonomy_node)
    assert node.uuid.present?
    assert_match(/\A[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\z/i, node.uuid)
  end

  test "should auto-generate slug on create" do
    node = create(:taxonomy_node, :topic, name: "Test Topic", slug: nil)
    assert_equal "topic-test-topic", node.slug
  end

  test "should not override existing uuid" do
    custom_uuid = SecureRandom.uuid
    node = create(:taxonomy_node, uuid: custom_uuid)
    assert_equal custom_uuid, node.uuid
  end

  test "should not override existing slug" do
    node = create(:taxonomy_node, :course, slug: "course-custom-slug")
    assert_equal "course-custom-slug", node.slug
  end

  # ============================================================================
  # Circular Reference Validation
  # ============================================================================

  test "should reject self as parent" do
    node = create(:taxonomy_node)
    node.parent = node

    assert_not node.valid?
    assert_includes node.errors[:parent], "cannot be self"
  end

  test "should reject circular parent reference" do
    parent = create(:taxonomy_node, :course)
    child = create(:taxonomy_node, :part, parent: parent)

    parent.parent = child

    assert_not parent.valid?
    assert_includes parent.errors[:parent], "would create a circular reference"
  end

  test "should reject deeply nested circular reference" do
    grandparent = create(:taxonomy_node, :course)
    parent = create(:taxonomy_node, :part, parent: grandparent)
    child = create(:taxonomy_node, :unit, parent: parent)

    grandparent.parent = child

    assert_not grandparent.valid?
    assert_includes grandparent.errors[:parent], "would create a circular reference"
  end

  # ============================================================================
  # Intra Course Uniqueness Validation
  # ============================================================================

  test "should reject duplicate topic name in same course" do
    course = create(:taxonomy_node, :course)
    create(:taxonomy_node, :topic, name: "Same Name", course: course)
    duplicate = build(:taxonomy_node, :topic, name: "Same Name", course: course)

    assert_not duplicate.valid?
    assert_includes duplicate.errors[:base].join, "Topic with this name already exists"
  end

  test "should accept same topic name in different courses" do
    course1 = create(:taxonomy_node, :course)
    course2 = create(:taxonomy_node, :course)
    create(:taxonomy_node, :topic, name: "Same Name", course: course1)
    duplicate = build(:taxonomy_node, :topic, name: "Same Name", course: course2)

    assert duplicate.valid?
  end

  test "should accept same topic name without course" do
    create(:taxonomy_node, :topic, name: "Same Name")
    duplicate = build(:taxonomy_node, :topic, name: "Same Name")

    assert duplicate.valid?
  end

  test "should be case insensitive for topic name uniqueness" do
    course = create(:taxonomy_node, :course)
    create(:taxonomy_node, :topic, name: "Same Name", course: course)
    duplicate = build(:taxonomy_node, :topic, name: "same name", course: course)

    assert_not duplicate.valid?
  end
end
