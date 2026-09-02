# frozen_string_literal: true

module Api
  class GamificationController < AuthenticatedController
    skip_after_action :verify_authorized

    def status
      streak = calculate_streak
      hearts = 5

      render json: { streak: streak, hearts: hearts }
    end

    private

    def calculate_streak
      qualifying_dates = current_user.assessment_sessions
                                     .where.not(taxonomy_node_id: nil)
                                     .where(score_percentage: 70..)
                                     .where.not(completed_at: nil)
                                     .order(completed_at: :desc)
                                     .pluck(Arel.sql("DATE(completed_at)"))
                                     .uniq

      return 0 if qualifying_dates.empty?

      streak = 1
      previous_date = qualifying_dates[0]

      qualifying_dates[1..].each do |date|
        if date == previous_date - 1
          streak += 1
          previous_date = date
        elsif date < previous_date - 1
          break
        end
      end

      streak
    end
  end
end
