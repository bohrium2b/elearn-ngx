require "test_helper"

class AnalyticsPolicyTest < ActiveSupport::TestCase
  def setup
    @student = create(:user, :student)
    @content_author = create(:user, :content_author)
    @instructor = create(:user, :instructor)
    @admin = create(:user, :admin)
  end

  def test_index
    assert_not AnalyticsPolicy.new(nil, :analytics).index?
    assert_not AnalyticsPolicy.new(@student, :analytics).index?
    assert_not AnalyticsPolicy.new(@content_author, :analytics).index?
    assert AnalyticsPolicy.new(@instructor, :analytics).index?
    assert AnalyticsPolicy.new(@admin, :analytics).index?
  end

  def test_show
    assert_not AnalyticsPolicy.new(nil, :analytics).show?
    assert_not AnalyticsPolicy.new(@student, :analytics).show?
    assert AnalyticsPolicy.new(@instructor, :analytics).show?
    assert AnalyticsPolicy.new(@admin, :analytics).show?
  end

  def test_performance_logs
    assert_not AnalyticsPolicy.new(nil, :analytics).performance_logs?
    assert_not AnalyticsPolicy.new(@student, :analytics).performance_logs?
    assert_not AnalyticsPolicy.new(@content_author, :analytics).performance_logs?
    assert AnalyticsPolicy.new(@instructor, :analytics).performance_logs?
    assert AnalyticsPolicy.new(@admin, :analytics).performance_logs?
  end
end
