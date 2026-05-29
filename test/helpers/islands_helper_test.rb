require "test_helper"

class IslandsHelperTest < ActionView::TestCase
  include IslandsHelper

  test "react_island_tag renders a custom element with data-props" do
    html = react_island_tag("hello-island", { greeting: "Hi", name: "Tester" })
    assert_includes html, "<hello-island"
    assert_includes html, 'data-props='
    assert_includes html, '"greeting":"Hi"'
    assert_includes html, '"name":"Tester"'
    assert_includes html, "</hello-island>"
  end

  test "react_island_tag works with an empty props hash" do
    html = react_island_tag("counter-island")
    assert_includes html, "<counter-island"
    assert_includes html, "data-props=\"{}\""
  end

  test "react_island_tag raises ArgumentError for names without a hyphen" do
    assert_raises(ArgumentError) { react_island_tag("island") }
  end
end
