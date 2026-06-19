# frozen_string_literal: true

require "test_helper"

class WorkspacePolicyTest < ActiveSupport::TestCase
  setup do
    @student = create(:user, :student)
    @content_author = create(:user, :content_author)
    @instructor = create(:user, :instructor)
    @admin = create(:user, :admin)
  end

  # ============================================================================
  # Show
  # ============================================================================

  test "anyone can show workspace" do
    policy = WorkspacePolicy.new(nil, :workspace)
    assert policy.show?
  end

  test "student can show workspace" do
    policy = WorkspacePolicy.new(@student, :workspace)
    assert policy.show?
  end

  # ============================================================================
  # Update
  # ============================================================================

  test "student cannot update workspace" do
    policy = WorkspacePolicy.new(@student, :workspace)
    assert_not policy.update?
  end

  test "content_author can update workspace" do
    policy = WorkspacePolicy.new(@content_author, :workspace)
    assert policy.update?
  end

  test "instructor can update workspace" do
    policy = WorkspacePolicy.new(@instructor, :workspace)
    assert policy.update?
  end

  test "admin can update workspace" do
    policy = WorkspacePolicy.new(@admin, :workspace)
    assert policy.update?
  end
end
