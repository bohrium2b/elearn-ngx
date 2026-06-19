# frozen_string_literal: true

require "test_helper"

class ExercisePolicyTest < ActiveSupport::TestCase
  setup do
    @student = create(:user, :student)
    @content_author = create(:user, :content_author)
    @instructor = create(:user, :instructor)
    @admin = create(:user, :admin)
    @exercise = create(:exercise)
  end

  # ============================================================================
  # Index
  # ============================================================================

  test "anyone can index exercises" do
    policy = ExercisePolicy.new(nil, @exercise)
    assert policy.index?
  end

  # ============================================================================
  # Show
  # ============================================================================

  test "anyone can show exercises" do
    policy = ExercisePolicy.new(nil, @exercise)
    assert policy.show?
  end

  # ============================================================================
  # Create
  # ============================================================================

  test "student cannot create exercises" do
    policy = ExercisePolicy.new(@student, @exercise)
    assert_not policy.create?
  end

  test "content_author can create exercises" do
    policy = ExercisePolicy.new(@content_author, @exercise)
    assert policy.create?
  end

  test "instructor cannot create exercises" do
    policy = ExercisePolicy.new(@instructor, @exercise)
    assert_not policy.create?
  end

  test "admin can create exercises" do
    policy = ExercisePolicy.new(@admin, @exercise)
    assert policy.create?
  end

  # ============================================================================
  # Update
  # ============================================================================

  test "student cannot update exercises" do
    policy = ExercisePolicy.new(@student, @exercise)
    assert_not policy.update?
  end

  test "content_author can update exercises" do
    policy = ExercisePolicy.new(@content_author, @exercise)
    assert policy.update?
  end

  test "instructor cannot update exercises" do
    policy = ExercisePolicy.new(@instructor, @exercise)
    assert_not policy.update?
  end

  test "admin can update exercises" do
    policy = ExercisePolicy.new(@admin, @exercise)
    assert policy.update?
  end

  # ============================================================================
  # Destroy
  # ============================================================================

  test "student cannot destroy exercises" do
    policy = ExercisePolicy.new(@student, @exercise)
    assert_not policy.destroy?
  end

  test "content_author can destroy exercises" do
    policy = ExercisePolicy.new(@content_author, @exercise)
    assert policy.destroy?
  end

  test "instructor cannot destroy exercises" do
    policy = ExercisePolicy.new(@instructor, @exercise)
    assert_not policy.destroy?
  end

  test "admin can destroy exercises" do
    policy = ExercisePolicy.new(@admin, @exercise)
    assert policy.destroy?
  end

  # ============================================================================
  # Start
  # ============================================================================

  test "anyone can start exercises" do
    policy = ExercisePolicy.new(nil, @exercise)
    assert policy.start?
  end

  test "student can start exercises" do
    policy = ExercisePolicy.new(@student, @exercise)
    assert policy.start?
  end

  # ============================================================================
  # Scope
  # ============================================================================

  test "scope resolves to all exercises" do
    scope = ExercisePolicy::Scope.new(@student, Exercise.all)
    assert_equal Exercise.all, scope.resolve
  end
end
