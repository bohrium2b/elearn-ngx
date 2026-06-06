ENV["RAILS_ENV"] ||= "test"
require_relative "../config/environment"
require "rails/test_help"
require "minitest/autorun"

class ActiveSupport::TestCase
  include FactoryBot::Syntax::Methods

  # Run tests in parallel with specified workers
  parallelize(workers: :number_of_processors)

  # Setup all fixtures in test/fixtures/*.yml for all tests in alphabetical order.
  fixtures :all

  # Add more helper methods to be used by all tests here...
end

class ActionDispatch::IntegrationTest
  include FactoryBot::Syntax::Methods
  include Devise::Test::IntegrationHelpers

  # Disable CSRF protection for integration tests
  setup do
    ActionController::Base.allow_forgery_protection = false
  end

  teardown do
    ActionController::Base.allow_forgery_protection = true
  end
end

class ActionDispatch::SystemTestCase
  include FactoryBot::Syntax::Methods
  include Devise::Test::IntegrationHelpers
end
