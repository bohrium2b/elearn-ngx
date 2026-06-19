# frozen_string_literal: true

require "test_helper"

class UserTest < ActiveSupport::TestCase
  # ============================================================================
  # Validations
  # ============================================================================

  test "should be valid with valid attributes" do
    user = build(:user)
    assert user.valid?
  end

  test "should require email" do
    user = build(:user, email: nil)
    assert_not user.valid?
    assert_includes user.errors[:email], "can't be blank"
  end

  test "should require unique email" do
    create(:user, email: "test@example.com")
    user = build(:user, email: "test@example.com")
    assert_not user.valid?
    assert_includes user.errors[:email], "has already been taken"
  end

  test "should require username" do
    user = build(:user, username: nil)
    assert_not user.valid?
    assert_includes user.errors[:username], "can't be blank"
  end

  test "should require unique username" do
    create(:user, username: "testuser")
    user = build(:user, username: "testuser")
    assert_not user.valid?
    assert_includes user.errors[:username], "has already been taken"
  end

  test "should require username minimum length" do
    user = build(:user, username: "ab")
    assert_not user.valid?
    assert_includes user.errors[:username], "is too short (minimum is 3 characters)"
  end

  test "should require username maximum length" do
    user = build(:user, username: "a" * 31)
    assert_not user.valid?
    assert_includes user.errors[:username], "is too long (maximum is 30 characters)"
  end

  test "should accept valid username format" do
    user = build(:user, username: "valid_user123")
    user.valid?
    assert_not(user.errors[:username].any? { |e| e.include?("only allows") })
  end

  test "should reject invalid username format" do
    user = build(:user, username: "invalid-user!")
    assert_not user.valid?
    assert(user.errors[:username].any? { |e| e.include?("only allows") })
  end

  test "should require password" do
    user = build(:user, password: nil, password_confirmation: nil)
    assert_not user.valid?
  end

  test "should require password confirmation" do
    user = build(:user, password_confirmation: "different_password")
    assert_not user.valid?
    assert_includes user.errors[:password_confirmation], "doesn't match Password"
  end

  # ============================================================================
  # Associations
  # ============================================================================

  test "should have many assessment_sessions" do
    user = create(:user)
    exercise = create(:exercise)
    session1 = create(:assessment_session, user: user, exercise: exercise)
    session2 = create(:assessment_session, user: user, exercise: exercise)

    assert_includes user.assessment_sessions, session1
    assert_includes user.assessment_sessions, session2
    assert_equal 2, user.assessment_sessions.count
  end

  test "should destroy assessment_sessions when destroyed" do
    user = create(:user)
    exercise = create(:exercise)
    create(:assessment_session, user: user, exercise: exercise)

    assert_difference("AssessmentSession.count", -1) do
      user.destroy
    end
  end

  # ============================================================================
  # Roles
  # ============================================================================

  test "should assign default student role on create" do
    user = create(:user)
    assert user.has_role?(:student)
  end

  test "student? returns true for student role" do
    user = create(:user, :student)
    assert user.student?
  end

  test "student? returns false for non-student" do
    user = create(:user, :admin)
    assert_not user.student?
  end

  test "content_author? returns true for content_author role" do
    user = create(:user, :content_author)
    assert user.content_author?
  end

  test "content_author? returns false for non-content_author" do
    user = create(:user, :student)
    assert_not user.content_author?
  end

  test "instructor? returns true for instructor role" do
    user = create(:user, :instructor)
    assert user.instructor?
  end

  test "instructor? returns false for non-instructor" do
    user = create(:user, :student)
    assert_not user.instructor?
  end

  test "admin? returns true for admin role" do
    user = create(:user, :admin)
    assert user.admin?
  end

  test "admin? returns false for non-admin" do
    user = create(:user, :student)
    assert_not user.admin?
  end

  test "role_name returns first role name" do
    user = create(:user, :admin)
    assert_equal "admin", user.role_name
  end

  test "role_name returns student when no roles" do
    user = create(:user)
    user.roles.clear
    assert_equal "student", user.role_name
  end

  # ============================================================================
  # Instance Methods
  # ============================================================================

  test "avatar_url returns nil by default" do
    user = create(:user)
    assert_nil user.avatar_url
  end

  # ============================================================================
  # Devise Modules
  # ============================================================================

  test "should be database authenticatable" do
    user = create(:user)
    assert user.valid_password?("password123")
  end

  test "should not authenticate with wrong password" do
    user = create(:user)
    assert_not user.valid_password?("wrongpassword")
  end

  # ============================================================================
  # Rolify
  # ============================================================================

  test "should be able to add roles" do
    user = create(:user)
    user.add_role(:instructor)
    assert user.has_role?(:instructor)
  end

  test "should be able to remove roles" do
    user = create(:user, :instructor)
    user.remove_role(:instructor)
    assert_not user.has_role?(:instructor)
  end

  test "should be able to have multiple roles" do
    user = create(:user)
    user.add_role(:content_author)
    user.add_role(:instructor)
    assert user.has_role?(:student)
    assert user.has_role?(:content_author)
    assert user.has_role?(:instructor)
  end
end
