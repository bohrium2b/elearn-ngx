class AnalyticsController < ApplicationController
  before_action :authenticate_user!
  before_action :verify_instructor_or_admin
  after_action :verify_authorized

  def index
    authorize :analytics, :index?
    # Analytics dashboard logic
  end

  def performance_logs
    authorize :analytics, :performance_logs?
    # Performance logs logic
  end

  private

  def verify_instructor_or_admin
    return if current_user.instructor? || current_user.admin?

    flash[:alert] = "You are not authorized to perform this action."
    redirect_to root_path
  end
end
