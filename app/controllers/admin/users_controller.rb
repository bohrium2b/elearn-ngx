module Admin
  class UsersController < ApplicationController
    before_action :authenticate_user!
    before_action :verify_admin
    after_action :verify_authorized

    def index
      @users = User.includes(:roles).all
      authorize User
    end

    def show
      @user = User.find(params[:id])
      authorize @user
    end

    def edit
      @user = User.find(params[:id])
      authorize @user
    end

    def update
      @user = User.find(params[:id])
      authorize @user

      if @user.update(user_params)
        redirect_to admin_user_path(@user), notice: "User updated successfully."
      else
        render :edit, status: :unprocessable_content
      end
    end

    def destroy
      @user = User.find(params[:id])
      authorize @user
      @user.destroy
      redirect_to admin_users_path, notice: "User deleted successfully."
    end

    private

    def verify_admin
      return if current_user.admin?

      flash[:alert] = "You are not authorized to perform this action."
      redirect_to root_path
    end

    def user_params
      params.require(:user).permit(:username, :email, :avatar_url, role_ids: [])
    end
  end
end
