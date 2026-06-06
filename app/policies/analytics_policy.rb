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
