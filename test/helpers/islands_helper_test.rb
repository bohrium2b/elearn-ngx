# frozen_string_literal: true

require "test_helper"

class IslandsHelperTest < ActionView::TestCase
  # ============================================================================
  # react_island_tag
  # ============================================================================

  test "react_island_tag renders custom element with data-props" do
    result = react_island_tag("hello-island", { greeting: "Hello" })
    assert_includes result, "<hello-island"
    assert_includes result, "data-props"
    assert_includes result, "</hello-island>"
  end

  test "react_island_tag serializes props as JSON" do
    result = react_island_tag("test-island", { key: "value" })
    assert_includes result, '{"key":"value"}'
  end

  test "react_island_tag raises error for name without hyphen" do
    assert_raises(ArgumentError) do
      react_island_tag("nohyphen", {})
    end
  end

  test "react_island_tag accepts name with hyphen" do
    result = react_island_tag("my-island", {})
    assert_includes result, "<my-island"
  end

  test "react_island_tag handles empty props" do
    result = react_island_tag("empty-island", {})
    assert_includes result, "{}"
  end

  test "react_island_tag handles nested props" do
    props = { user: { name: "John", age: 30 }, items: [1, 2, 3] }
    result = react_island_tag("nested-island", props)
    assert_includes result, "data-props"
    # Verify JSON is present (escaped in HTML)
    json_match = result.match(/data-props="([^"]*)"/)
    assert json_match
  end

  test "react_island_tag returns html_safe string" do
    result = react_island_tag("safe-island", {})
    assert result.html_safe?
  end

  test "react_island_tag escapes HTML in props" do
    result = react_island_tag("xss-island", { content: "<script>alert('xss')</script>" })
    assert_not_includes result, "<script>"
  end
end
