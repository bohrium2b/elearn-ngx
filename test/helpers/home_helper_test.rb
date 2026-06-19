# frozen_string_literal: true

require "test_helper"

class HomeHelperTest < ActionView::TestCase
  test "should be defined" do
    assert(defined?(HomeHelper))
  end

  test "should be a module" do
    assert_kind_of Module, HomeHelper
  end
end
