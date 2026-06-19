# frozen_string_literal: true

class AssessmentSessionPolicy < ApplicationPolicy
  def index?
    authenticated?
  end

  def show?
    own_record? || instructor? || admin?
  end

  def create?
    authenticated?
  end

  def update?
    own_record? || instructor? || admin?
  end

  class Scope < Scope
    def resolve
      if user&.instructor? || user&.admin?
        scope.all
      elsif user
        scope.where(user: user)
      else
        scope.none
      end
    end
  end

  private

  def own_record?
    user.present? && record.user_id == user.id
  end
end
