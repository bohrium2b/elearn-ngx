# frozen_string_literal: true

class ContentAssignmentPolicy < ApplicationPolicy
  def create?
    content_author? || instructor? || admin?
  end

  def update?
    content_author? || instructor? || admin?
  end

  def destroy?
    content_author? || instructor? || admin?
  end

  class Scope < Scope
    def resolve
      scope.all
    end
  end
end
