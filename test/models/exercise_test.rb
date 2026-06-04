require "test_helper"

class ExerciseTest < ActiveSupport::TestCase
  # Test Case: Assert that an exercise without a title or an empty set of selection rules fails validation.
  test "should not save exercise without title or selection rules" do
    exercise = Exercise.new(spec: { "selection_rules" => [] })
    assert_not exercise.save, "Saved exercise without title"

    exercise.title = "Test"
    assert_not exercise.save, "Saved exercise with empty selection rules"

    exercise.spec = { "selection_rules" => [{ "type" => "dynamic_tag", "tag_uuid" => SecureRandom.uuid, "count" => 1,
                                              "strategy" => "random" }] }
    # Still might fail if tag_uuid doesn't exist, but let's check rules logic
    # For the purpose of this rule check, we assume the existence of a tag would be validated later
    # The prompt specifically says assert empty selection rules fails validation
    exercise2 = Exercise.new(title: "Test")
    assert_not exercise2.save, "Saved exercise without spec"
  end

  # Test Case: Given Tag A has exactly 2 unique questions, assert that saving an exercise requesting a count of 3 from Tag A fails validation.
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

  # Test Case: Given Tag B is a child of Tag A, assert that adding rules for both Tag A and Tag B within the same configuration fails validation.
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
end
