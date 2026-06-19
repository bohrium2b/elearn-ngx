# frozen_string_literal: true

# rubocop:disable Style/ClassAndModuleChildren
class User::ParameterSanitizer < Devise::ParameterSanitizer
  def initialize(*)
    super
    permit(:sign_up, keys: %i[username email password password_confirmation])
    permit(:account_update,
           keys: %i[username email password password_confirmation current_password avatar_url])
  end

  # Explicitly reject role parameters
  def sanitize(action)
    super
    case action
    when :sign_up, :account_update
      params[:user].presence&.delete(:role)
      params[:user].presence&.delete(:roles)
    end
  end
end
# rubocop:enable Style/ClassAndModuleChildren
