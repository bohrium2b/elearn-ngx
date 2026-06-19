# frozen_string_literal: true

require "test_helper"

class TagPolicyTest < ActiveSupport::TestCase
  setup do
    @student = create(:user, :student)
    @content_author = create(:user, :content_author)
    @instructor = create(:user, :instructor)
    @admin = create(:user, :admin)
    @tag = create(:tag)
  end

  # ============================================================================
  # Index
  # ============================================================================

  test "anyone can index tags" do
    policy = TagPolicy.new(nil, @tag)
    assert policy.index?
  end

  # ============================================================================
  # Show
  # ============================================================================

  test "anyone can show tags" do
    policy = TagPolicy.new(nil, @tag)
    assert policy.show?
  end

  # ============================================================================
  # Create
  # ============================================================================

  test "student cannot create tags" do
    policy = TagPolicy.new(@student, @tag)
    assert_not policy.create?
  end

  test "content_author can create tags" do
    policy = TagPolicy.new(@content_author, @tag)
    assert policy.create?
  end

  test "instructor cannot create tags" do
    policy = TagPolicy.new(@instructor, @tag)
    assert_not policy.create?
  end

  test "admin can create tags" do
    policy = TagPolicy.new(@admin, @tag)
    assert policy.create?
  end

  # ============================================================================
  # Update
  # ============================================================================

  test "student cannot update tags" do
    policy = TagPolicy.new(@student, @tag)
    assert_not policy.update?
  end

  test "content_author can update tags" do
    policy = TagPolicy.new(@content_author, @tag)
    assert policy.update?
  end

  test "instructor cannot update tags" do
    policy = TagPolicy.new(@instructor, @tag)
    assert_not policy.update?
  end

  test "admin can update tags" do
    policy = TagPolicy.new(@admin, @tag)
    assert policy.update?
  end

  # ============================================================================
  # Destroy
  # ============================================================================

  test "student cannot destroy tags" do
    policy = TagPolicy.new(@student, @tag)
    assert_not policy.destroy?
  end

  test "content_author can destroy tags" do
    policy = TagPolicy.new(@content_author, @tag)
    assert policy.destroy?
  end

  test "instructor cannot destroy tags" do
    policy = TagPolicy.new(@instructor, @tag)
    assert_not policy.destroy?
  end

  test "admin can destroy tags" do
    policy = TagPolicy.new(@admin, @tag)
    assert policy.destroy?
  end

  # ============================================================================
  # Scope
  # ============================================================================

  test "scope resolves to all tags" do
    scope = TagPolicy::Scope.new(@student, Tag.all)
    assert_equal Tag.all, scope.resolve
  end
end
