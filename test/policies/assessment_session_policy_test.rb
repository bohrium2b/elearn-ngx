# frozen_string_literal: true

require "test_helper"

class AssessmentSessionPolicyTest < ActiveSupport::TestCase
  setup do
    @student = create(:user, :student)
    @instructor = create(:user, :instructor)
    @admin = create(:user, :admin)
    @exercise = create(:exercise)
    @session = create(:assessment_session, user: @student, exercise: @exercise)
  end

  # ============================================================================
  # Show
  # ============================================================================

  test "student can show own session" do
    policy = AssessmentSessionPolicy.new(@student, @session)
    assert policy.show?
  end

  test "instructor can show any session" do
    policy = AssessmentSessionPolicy.new(@instructor, @session)
    assert policy.show?
  end

  test "admin can show any session" do
    policy = AssessmentSessionPolicy.new(@admin, @session)
    assert policy.show?
  end

  test "student cannot show other user session" do
    other_user = create(:user)
    other_session = create(:assessment_session, user: other_user, exercise: @exercise)
    policy = AssessmentSessionPolicy.new(@student, other_session)
    assert_not policy.show?
  end

  # ============================================================================
  # Create
  # ============================================================================

  test "student can create session" do
    policy = AssessmentSessionPolicy.new(@student, AssessmentSession.new)
    assert policy.create?
  end

  # ============================================================================
  # Update
  # ============================================================================

  test "student can update own session" do
    policy = AssessmentSessionPolicy.new(@student, @session)
    assert policy.update?
  end

  test "instructor can update any session" do
    policy = AssessmentSessionPolicy.new(@instructor, @session)
    assert policy.update?
  end

  test "admin can update any session" do
    policy = AssessmentSessionPolicy.new(@admin, @session)
    assert policy.update?
  end
end
