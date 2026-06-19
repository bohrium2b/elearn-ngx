# frozen_string_literal: true

module Admin
  class UsersController < ApplicationController
    before_action :authenticate_user!
    before_action :verify_admin
    after_action :verify_authorized

    def index
      @users = User.includes(:roles).all
      authorize User

      respond_to do |format|
        format.html
        format.json { render json: @users }
      end
    end

    def show
      @user = User.find(params[:id])
      authorize @user

      respond_to do |format|
        format.html
        format.json { render json: @user }
      end
    end

    def edit
      @user = User.find(params[:id])
      authorize @user

      respond_to do |format|
        format.html
        format.json { render json: @user }
      end
    end

    def update
      @user = User.find(params[:id])
      authorize @user

      if @user.update(user_params)
        respond_to do |format|
          format.html { redirect_to admin_user_path(@user), notice: t("messages.user_updated") }
          format.json { render json: @user }
        end
      else
        respond_to do |format|
          format.html { render :edit, status: :unprocessable_content }
          format.json { render json: { errors: @user.errors.full_messages }, status: :unprocessable_content }
        end
      end
    end

    def destroy
      @user = User.find(params[:id])
      authorize @user
      @user.destroy

      respond_to do |format|
        format.html { redirect_to admin_users_path, notice: t("messages.user_deleted") }
        format.json { head :no_content }
      end
    end

    private

    def verify_admin
      return if current_user.admin?

      flash[:alert] = t("messages.not_authorized")
      redirect_to root_path
    end

    def user_params
      params.require(:user).permit(:username, :email, :avatar_url, role_ids: [])
    end
  end
end
