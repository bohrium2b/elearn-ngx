require "test_helper"

class UserTest < ActiveSupport::TestCase
  setup do
    @user = build(:user)
  end

  test "should be valid with valid attributes" do
    assert @user.valid?
  end

  test "should require email" do
    @user.email = nil
    assert_not @user.valid?
    assert_includes @user.errors[:email], "can't be blank"
  end

  test "should require unique email" do
    existing_user = create(:user)
    @user.email = existing_user.email
    assert_not @user.valid?
    assert_includes @user.errors[:email], "has already been taken"
  end

  test "should require username" do
    @user.username = nil
    assert_not @user.valid?
    assert_includes @user.errors[:username], "can't be blank"
  end

  test "should require unique username" do
    existing_user = create(:user)
    @user.username = existing_user.username
    assert_not @user.valid?
    assert_includes @user.errors[:username], "has already been taken"
  end

  test "username should have minimum length" do
    @user.username = "ab"
    assert_not @user.valid?
    assert_includes @user.errors[:username], "is too short (minimum is 3 characters)"
  end

  test "username should have maximum length" do
    @user.username = "a" * 31
    assert_not @user.valid?
    assert_includes @user.errors[:username], "is too long (maximum is 30 characters)"
  end

  test "username should only allow letters numbers and underscores" do
    @user.username = "user-name!"
    assert_not @user.valid?
    assert_includes @user.errors[:username], "only allows letters, numbers, and underscores"
  end

  test "should assign student role by default" do
    @user.save!
    assert @user.student?
    assert_equal "student", @user.role_name
  end

  test "should have role helper methods" do
    @user.save!
    assert @user.student?
    assert_not @user.content_author?
    assert_not @user.instructor?
    assert_not @user.admin?
  end

  test "should allow role assignment" do
    @user.save!
    @user.add_role(:content_author)
    assert @user.content_author?
  end

  test "role_name should return first role" do
    @user.save!
    assert_equal "student", @user.role_name
    @user.add_role(:admin)
    assert_equal "student", @user.role_name
  end
end
