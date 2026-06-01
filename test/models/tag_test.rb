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
end
