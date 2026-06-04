require "test_helper"

class TagTest < ActiveSupport::TestCase
  test "tag generates uuid slug color and permalink" do
    tag = create(:tag, name: "Organic Chemistry")

    assert_predicate tag.uuid, :present?
    assert_equal "tag-organic-chemistry", tag.slug
    assert_match(/\A#[0-9a-f]{6}\z/, tag.color)
    assert_equal "#{tag.uuid}-x:organic-chemistry", tag.to_param
  end

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

  test "destroying a tag clears question links and destroys children" do
    parent = create(:tag)
    child = create(:tag, parent: parent)
    question = create(:question)
    parent.questions << question

    assert_difference -> { Tag.count }, -2 do
      parent.destroy
    end

    assert_not Tag.exists?(parent.id)
    assert_not Tag.exists?(child.id)
    assert_empty question.reload.tags
  end

  # Test Case: Assert that calling .total_questions_in_branch on a parent tag successfully counts questions mapped directly to it as well as its descendant tags.
  test "all_applicable_questions includes questions from descendants" do
    root = create(:tag)
    child = create(:tag, parent: root)

    q_root = create(:question)
    q_child = create(:question)

    root.questions << q_root
    child.questions << q_child

    assert_equal 2, root.total_questions_in_branch
  end

  # Test Case: Assert that when an exercise session is resolved, questions explicitly selected by a static UUID rule are not duplicated.
  test "resolve exercise spec deduplicates static and dynamic questions" do
    tag = create(:tag)
    question = create(:question)
    tag.questions << question

    static_uuid = question.uuid

    spec = {
      "selection_rules" => [
        { "type" => "dynamic_tag", "tag_uuid" => tag.uuid, "count" => 5, "strategy" => "random" },
        { "type" => "static_question", "question_uuid" => static_uuid }
      ]
    }

    exercise = Exercise.new(title: "Dedup Test", spec: spec)
    assert exercise.valid?, "Exercise should be valid"

    resolved = @controller.send(:resolve_exercise_spec, spec)
    uuids = resolved.map { |q| q[:uuid] }
    assert_equal uuids.uniq.count, uuids.count, "Questions should be unique"
  end
end
