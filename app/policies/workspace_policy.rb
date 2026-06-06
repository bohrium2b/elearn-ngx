# frozen_string_literal: true

class WorkspacePolicy < ApplicationPolicy
  def show?
    content_author? || admin?
  end

  def update?
    content_author? || admin?
  end

  class Scope < Scope
    def resolve
      scope.all
    end
  end
end
