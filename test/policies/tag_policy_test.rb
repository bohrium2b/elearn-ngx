require "test_helper"

class TagPolicyTest < ActiveSupport::TestCase
  def setup
    @student = create(:user, :student)
    @content_author = create(:user, :content_author)
    @instructor = create(:user, :instructor)
    @admin = create(:user, :admin)
    @tag = create(:tag)
  end

  def test_index
    assert TagPolicy.new(nil, @tag).index?
    assert TagPolicy.new(@student, @tag).index?
  end

  def test_show
    assert TagPolicy.new(nil, @tag).show?
    assert TagPolicy.new(@student, @tag).show?
  end

  def test_create
    assert_not TagPolicy.new(@student, @tag).create?
    assert TagPolicy.new(@content_author, @tag).create?
    # Instructor does not have create permission in TagPolicy
    assert_not TagPolicy.new(@instructor, @tag).create?
    assert TagPolicy.new(@admin, @tag).create?
  end

  def test_update
    assert_not TagPolicy.new(@student, @tag).update?
    assert TagPolicy.new(@content_author, @tag).update?
    # Instructor does not have update permission in TagPolicy
    assert_not TagPolicy.new(@instructor, @tag).update?
    assert TagPolicy.new(@admin, @tag).update?
  end

  def test_destroy
    assert_not TagPolicy.new(@student, @tag).destroy?
    assert TagPolicy.new(@content_author, @tag).destroy?
    # Instructor does not have destroy permission in TagPolicy
    assert_not TagPolicy.new(@instructor, @tag).destroy?
    assert TagPolicy.new(@admin, @tag).destroy?
  end
end
