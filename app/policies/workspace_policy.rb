# frozen_string_literal: true

class WorkspacePolicy < ApplicationPolicy
  def show?
    true
  end

  def update?
    content_author? || instructor? || admin?
  end

  class Scope < Scope
    def resolve
      scope.all
    end
  end
end
