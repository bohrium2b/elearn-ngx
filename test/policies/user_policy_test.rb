# frozen_string_literal: true

require "test_helper"

class UserPolicyTest < ActiveSupport::TestCase
  setup do
    @student = create(:user, :student)
    @content_author = create(:user, :content_author)
    @instructor = create(:user, :instructor)
    @admin = create(:user, :admin)
  end

  # ============================================================================
  # Show
  # ============================================================================

  test "student can view own profile" do
    policy = UserPolicy.new(@student, @student)
    assert policy.show?
  end

  test "admin can view any profile" do
    policy = UserPolicy.new(@admin, @student)
    assert policy.show?
  end

  # ============================================================================
  # Update
  # ============================================================================

  test "student can update own profile" do
    policy = UserPolicy.new(@student, @student)
    assert policy.update?
  end

  test "admin can update any profile" do
    policy = UserPolicy.new(@admin, @student)
    assert policy.update?
  end

  # ============================================================================
  # Destroy
  # ============================================================================

  test "admin can destroy users" do
    policy = UserPolicy.new(@admin, @student)
    assert policy.destroy?
  end

  test "student cannot destroy users" do
    policy = UserPolicy.new(@student, @student)
    assert_not policy.destroy?
  end
end
