# frozen_string_literal: true

class AuthenticatedController < ApplicationController
  before_action :authenticate_user!
  after_action :verify_authorized

end
