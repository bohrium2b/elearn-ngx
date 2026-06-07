# frozen_string_literal: true

class AnalyticsPolicy < ApplicationPolicy
  def index?
    instructor? || admin?
  end

  def show?
    instructor? || admin?
  end

  def performance_logs?
    instructor? || admin?
  end

  # Student-facing actions
  def dashboard?
    authenticated?
  end

  def review?
    authenticated?
  end

  def weak_points?
    authenticated?
  end

  def recommendations?
    authenticated?
  end

  # Instructor/admin-only aggregate actions
  def cohort?
    instructor? || admin?
  end

  def tag_matrix?
    instructor? || admin?
  end

  def item_discrimination?
    instructor? || admin?
  end

  class Scope < Scope
    def resolve
      if user&.instructor? || user&.admin?
        scope.all
      else
        scope.none
      end
    end
  end
end
