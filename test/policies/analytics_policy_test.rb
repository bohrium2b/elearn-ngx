# frozen_string_literal: true

require "test_helper"

class AnalyticsPolicyTest < ActiveSupport::TestCase
  setup do
    @student = create(:user, :student)
    @instructor = create(:user, :instructor)
    @admin = create(:user, :admin)
  end

  # ============================================================================
  # Dashboard
  # ============================================================================

  test "student can view dashboard" do
    policy = AnalyticsPolicy.new(@student, :analytics)
    assert policy.dashboard?
  end

  test "instructor can view dashboard" do
    policy = AnalyticsPolicy.new(@instructor, :analytics)
    assert policy.dashboard?
  end

  test "admin can view dashboard" do
    policy = AnalyticsPolicy.new(@admin, :analytics)
    assert policy.dashboard?
  end

  # ============================================================================
  # Cohort
  # ============================================================================

  test "student cannot view cohort" do
    policy = AnalyticsPolicy.new(@student, :analytics)
    assert_not policy.cohort?
  end

  test "instructor can view cohort" do
    policy = AnalyticsPolicy.new(@instructor, :analytics)
    assert policy.cohort?
  end

  test "admin can view cohort" do
    policy = AnalyticsPolicy.new(@admin, :analytics)
    assert policy.cohort?
  end

  # ============================================================================
  # Review
  # ============================================================================

  test "student can review own sessions" do
    policy = AnalyticsPolicy.new(@student, :analytics)
    assert policy.review?
  end

  test "instructor can review any session" do
    policy = AnalyticsPolicy.new(@instructor, :analytics)
    assert policy.review?
  end

  test "admin can review any session" do
    policy = AnalyticsPolicy.new(@admin, :analytics)
    assert policy.review?
  end
end
