# frozen_string_literal: true

require "test_helper"

class AnalyticsAggregatorTest < ActiveSupport::TestCase
  setup do
    @tag = create(:tag, name: "Algebra")
    @question1 = create(:question)
    @question2 = create(:question)
    @question1.tags << @tag
    @question2.tags << @tag

    @student1 = create(:user, :student)
    @student2 = create(:user, :student)
    @exercise = create(:exercise)
  end

  test "calculates average performance score for a tag across multiple students" do
    # Student 1: 2/3 correct on questions under Tag A
    create(:assessment_session,
           user: @student1,
           exercise: @exercise,
           score_percentage: 66.67,
           completed_at: 1.day.ago,
           telemetry_data: {
             "question_responses" => [
               { "question_uuid" => @question1.uuid, "correct" => true },
               { "question_uuid" => @question2.uuid, "correct" => false }
             ],
             "tag_registry" => {}
           })

    # Student 2: 1/2 correct on questions under Tag A
    create(:assessment_session,
           user: @student2,
           exercise: @exercise,
           score_percentage: 50.0,
           completed_at: 2.days.ago,
           telemetry_data: {
             "question_responses" => [
               { "question_uuid" => @question1.uuid, "correct" => true },
               { "question_uuid" => @question2.uuid, "correct" => false }
             ],
             "tag_registry" => {}
           })

    result = AnalyticsAggregator.tag_average_score(@tag.uuid)
    assert_not_nil result
    assert_equal @tag.name, result[:tag_name]
    assert_equal 4, result[:total_responses]
    assert_equal 2, result[:correct_count]
    assert_equal 50.0, result[:average_score]
  end

  test "tag_average_score returns nil for non-existent tag" do
    result = AnalyticsAggregator.tag_average_score("non-existent-uuid")
    assert_nil result
  end

  test "tag_average_score returns nil when no questions have been attempted" do
    untouched_tag = create(:tag, name: "Geometry")
    result = AnalyticsAggregator.tag_average_score(untouched_tag.uuid)
    assert_nil result
  end

  test "cohort_metrics returns aggregate data" do
    create(:assessment_session, :perfect_score, user: @student1, exercise: @exercise)
    create(:assessment_session, :low_score, user: @student2, exercise: @exercise)

    metrics = AnalyticsAggregator.cohort_metrics

    assert metrics[:total_sessions] >= 2
    assert metrics[:unique_students] >= 2
    assert metrics[:average_score].is_a?(Float)
    assert metrics[:grade_distribution].is_a?(Hash)
    assert metrics[:grade_distribution]["A (90-100)"].is_a?(Integer)
  end

  test "item_discrimination_metrics flags high-failure questions" do
    question = create(:question)

    # Create sessions where this question has a 100% failure rate
    5.times do
      create(:assessment_session,
             user: create(:user, :student),
             exercise: @exercise,
             score_percentage: 0.0,
             completed_at: 1.day.ago,
             telemetry_data: {
               "question_responses" => [
                 { "question_uuid" => question.uuid, "correct" => false }
               ],
               "tag_registry" => {}
             })
    end

    items = AnalyticsAggregator.item_discrimination_metrics
    flagged_item = items.find { |i| i[:question_uuid] == question.uuid }

    assert_not_nil flagged_item, "Question should appear in discrimination metrics"
    assert flagged_item[:flagged], "Question with 100% failure rate and 5+ attempts should be flagged"
  end

  test "item_discrimination does not flag questions with few attempts" do
    question = create(:question)

    create(:assessment_session,
           user: @student1,
           exercise: @exercise,
           score_percentage: 0.0,
           completed_at: 1.day.ago,
           telemetry_data: {
             "question_responses" => [
               { "question_uuid" => question.uuid, "correct" => false }
             ],
             "tag_registry" => {}
           })

    items = AnalyticsAggregator.item_discrimination_metrics
    item = items.find { |i| i[:question_uuid] == question.uuid }

    assert_not_nil item
    assert_not item[:flagged], "Question with < 5 attempts should not be flagged"
  end

  test "tag_performance_matrix returns hierarchical structure" do
    child_tag = create(:tag, name: "Linear Equations", parent: @tag)
    child_question = create(:question)
    child_question.tags << child_tag

    create(:assessment_session,
           user: @student1,
           exercise: @exercise,
           score_percentage: 80.0,
           completed_at: 1.day.ago,
           telemetry_data: {
             "question_responses" => [
               { "question_uuid" => child_question.uuid, "correct" => true }
             ],
             "tag_registry" => {}
           })

    matrix = AnalyticsAggregator.tag_performance_matrix

    assert matrix.is_a?(Array)
    root_node = matrix.find { |n| n[:uuid] == @tag.uuid }
    assert_not_nil root_node, "Root tag should appear in matrix"
    assert root_node[:children].is_a?(Array)
    assert root_node[:average_score].is_a?(Float)
  end
end
