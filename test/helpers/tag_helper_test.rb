# frozen_string_literal: true

require "test_helper"

class TagHelperTest < ActionView::TestCase
  test "should be defined" do
    assert(defined?(TagHelper))
  end

  test "should be a module" do
    assert_kind_of Module, TagHelper
  end
end
