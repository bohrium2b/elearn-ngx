# frozen_string_literal: true

module Users
  class RegistrationsController < Devise::RegistrationsController
    layout "auth"

    protected

    def after_sign_up_path_for(_resource)
      root_path
    end

    def after_inactive_sign_up_path_for(_resource)
      new_user_session_path
    end

    def sign_up_params
      params.require(:user).permit(:username, :email, :password, :password_confirmation, :roles)
    end

    def account_update_params
      params.require(:user).permit(:username, :email, :password, :password_confirmation, :current_password, :avatar_url, :role_ids)
    end
  end
end
