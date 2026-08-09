# frozen_string_literal: true

class TaxonomyNodePolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    true
  end

  def create?
    content_author? || instructor? || admin?
  end

  def update?
    content_author? || instructor? || admin?
  end

  def destroy?
    content_author? || instructor? || admin?
  end

  def manage?
    admin?
  end

  class Scope < Scope
    def resolve
      scope.all
    end
  end
end
