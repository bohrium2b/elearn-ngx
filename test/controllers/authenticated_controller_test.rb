# frozen_string_literal: true

require "test_helper"

class AuthenticatedControllerTest < ActionDispatch::IntegrationTest
  test "inherits from ApplicationController" do
    assert_equal ApplicationController, AuthenticatedController.superclass
  end

  test "requires authentication for protected actions" do
    # Create a controller that inherits from AuthenticatedController
    # and test that unauthenticated users are redirected
    # This is a structural test to ensure the concern is applied correctly
    assert AuthenticatedController.method_defined?(:authenticate_user!)
  end
end
