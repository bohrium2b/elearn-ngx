# frozen_string_literal: true

require "simplecov"
SimpleCov.start "rails" do
  use_merging true
  add_filter "test/"
end

ENV["RAILS_ENV"] ||= "test"
require_relative "../config/environment"
require "rails/test_help"
Rails.application.eager_load!
require "minitest/autorun"

module ActiveSupport
  class TestCase
    include FactoryBot::Syntax::Methods

    # Run tests in parallel with specified workers
    parallelize(workers: :number_of_processors)

    # Setup all fixtures in test/fixtures/*.yml for all tests in alphabetical order.
    fixtures :all

    # Add more helper methods to be used by all tests here...
    parallelize_setup do |worker|
      SimpleCov.command_name "#{SimpleCov.command_name}-worker-#{worker}"
    end

    parallelize_teardown do |_worker|
      SimpleCov.result.format!
    end
  end
end

module ActionDispatch
  class IntegrationTest
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
end

module ActionDispatch
  class SystemTestCase
    include FactoryBot::Syntax::Methods
    include Devise::Test::IntegrationHelpers
  end
end
