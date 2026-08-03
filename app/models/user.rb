# frozen_string_literal: true

class User < ApplicationRecord
  rolify

  # Devise modules
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable,
         :trackable

  # Associations
  has_many :assessment_sessions, dependent: :destroy

  # Validations
  validates :username, presence: true, uniqueness: true,
                       length: { minimum: 3, maximum: 30 },
                       format: { with: /\A[a-zA-Z0-9_]+\z/, message: I18n.t("messages.only_allows_letters_numbers_underscores") }
  validates :email, presence: true, uniqueness: true

  # Callbacks
  after_create :assign_chosen_role

  # Role helper methods
  def student?
    has_role?(:student)
  end

  def content_author?
    has_role?(:content_author)
  end

  def instructor?
    has_role?(:instructor)
  end

  def admin?
    has_role?(:admin)
  end

  def role_name
    roles.first&.name || "student"
  end

  # Avatar URL - returns nil if not set (can be extended with Active Storage)
  def avatar_url
    # TODO: Implement with Active Storage when avatar upload is added
    nil
  end

  private

  def assign_default_role
    add_role(:student) if roles.blank?
  end

  def assign_chosen_role
    add_role(roles.first) if roles.any?
  end
end
