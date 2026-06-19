# frozen_string_literal: true

require "test_helper"

class QuestionPolicyTest < ActiveSupport::TestCase
  setup do
    @student = create(:user, :student)
    @content_author = create(:user, :content_author)
    @instructor = create(:user, :instructor)
    @admin = create(:user, :admin)
    @question = create(:question)
  end

  # ============================================================================
  # Index
  # ============================================================================

  test "anyone can index questions" do
    policy = QuestionPolicy.new(nil, @question)
    assert policy.index?
  end

  # ============================================================================
  # Show
  # ============================================================================

  test "anyone can show questions" do
    policy = QuestionPolicy.new(nil, @question)
    assert policy.show?
  end

  # ============================================================================
  # Create
  # ============================================================================

  test "student cannot create questions" do
    policy = QuestionPolicy.new(@student, @question)
    assert_not policy.create?
  end

  test "content_author can create questions" do
    policy = QuestionPolicy.new(@content_author, @question)
    assert policy.create?
  end

  test "instructor cannot create questions" do
    policy = QuestionPolicy.new(@instructor, @question)
    assert_not policy.create?
  end

  test "admin can create questions" do
    policy = QuestionPolicy.new(@admin, @question)
    assert policy.create?
  end

  # ============================================================================
  # Update
  # ============================================================================

  test "student cannot update questions" do
    policy = QuestionPolicy.new(@student, @question)
    assert_not policy.update?
  end

  test "content_author can update questions" do
    policy = QuestionPolicy.new(@content_author, @question)
    assert policy.update?
  end

  test "instructor cannot update questions" do
    policy = QuestionPolicy.new(@instructor, @question)
    assert_not policy.update?
  end

  test "admin can update questions" do
    policy = QuestionPolicy.new(@admin, @question)
    assert policy.update?
  end

  # ============================================================================
  # Destroy
  # ============================================================================

  test "student cannot destroy questions" do
    policy = QuestionPolicy.new(@student, @question)
    assert_not policy.destroy?
  end

  test "content_author can destroy questions" do
    policy = QuestionPolicy.new(@content_author, @question)
    assert policy.destroy?
  end

  test "instructor cannot destroy questions" do
    policy = QuestionPolicy.new(@instructor, @question)
    assert_not policy.destroy?
  end

  test "admin can destroy questions" do
    policy = QuestionPolicy.new(@admin, @question)
    assert policy.destroy?
  end

  # ============================================================================
  # Scope
  # ============================================================================

  test "scope resolves to all questions" do
    scope = QuestionPolicy::Scope.new(@student, Question.all)
    assert_equal Question.all, scope.resolve
  end
end
