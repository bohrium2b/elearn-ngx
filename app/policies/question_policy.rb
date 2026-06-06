# frozen_string_literal: true

class QuestionPolicy < ApplicationPolicy
  def index?
    true # Public can view
  end

  def show?
    true # Public can view
  end

  def create?
    content_author? || admin?
  end

  def update?
    content_author? || admin?
  end

  def destroy?
    content_author? || admin?
  end

  class Scope < Scope
    def resolve
      scope.all
    end
  end
end
