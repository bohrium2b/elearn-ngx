require "test_helper"

class UserPolicyTest < ActiveSupport::TestCase
  def setup
    @student = create(:user, :student)
    @content_author = create(:user, :content_author)
    @instructor = create(:user, :instructor)
    @admin = create(:user, :admin)
    @other_user = create(:user, :student)
  end

  def test_index
    assert_not UserPolicy.new(@student, @student).index?
    assert_not UserPolicy.new(@content_author, @content_author).index?
    assert_not UserPolicy.new(@instructor, @instructor).index?
    assert UserPolicy.new(@admin, @admin).index?
  end

  def test_show
    assert UserPolicy.new(@student, @student).show?
    assert_not UserPolicy.new(@student, @other_user).show?
    assert UserPolicy.new(@admin, @other_user).show?
  end

  def test_create
    assert_not UserPolicy.new(@student, @student).create?
    assert UserPolicy.new(@admin, @admin).create?
  end

  def test_update
    assert UserPolicy.new(@student, @student).update?
    assert_not UserPolicy.new(@student, @other_user).update?
    assert UserPolicy.new(@admin, @other_user).update?
  end

  def test_destroy
    assert_not UserPolicy.new(@student, @student).destroy?
    assert_not UserPolicy.new(@student, @other_user).destroy?
    assert UserPolicy.new(@admin, @other_user).destroy?
  end

  def test_manage_roles
    assert_not UserPolicy.new(@student, @student).manage_roles?
    assert_not UserPolicy.new(@content_author, @content_author).manage_roles?
    assert_not UserPolicy.new(@instructor, @instructor).manage_roles?
    assert UserPolicy.new(@admin, @admin).manage_roles?
  end
end
