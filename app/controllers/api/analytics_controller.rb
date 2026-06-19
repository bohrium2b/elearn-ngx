# frozen_string_literal: true

module Api
  class AnalyticsController < ApplicationController
    before_action :authenticate_user!

    # GET /api/analytics/topic_matrix
    def topic_matrix
      aggregator = AnalyticsAggregator.new
      matrix = aggregator.topic_performance_matrix(current_user)

      render json: matrix
    end

    # GET /api/analytics/topic_performance/:id
    def topic_performance
      topic = TaxonomyNode.find_by(param: params[:id])

      return render json: { error: "Topic not found" }, status: :not_found unless topic

      aggregator = AnalyticsAggregator.new
      performance = aggregator.topic_average_score(topic, current_user)

      render json: {
        topic_id: topic.id,
        topic_name: topic.name,
        performance: performance
      }
    end

    # GET /api/analytics/weak_points_by_topic
    def weak_points_by_topic
      analytics = StudentAnalytics.new(current_user)
      weak_points = analytics.weak_points_by_topic

      render json: weak_points
    end

    # GET /api/analytics/topic_recommendations
    def topic_recommendations
      analytics = StudentAnalytics.new(current_user)
      recommendations = analytics.topic_recommendations

      render json: recommendations
    end
  end
end
