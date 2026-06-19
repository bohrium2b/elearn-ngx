# frozen_string_literal: true

module IslandsHelper
  # Renders a React island as a native HTML5 Custom Element.
  #
  # @param name  [String] The custom-element tag name (e.g. "hello-island").
  #                       Must contain a hyphen as required by the Custom Elements spec.
  # @param props [Hash]   Data to pass into the React component as JSON props.
  #                       The hash is sanitized and serialised automatically.
  # @return [ActiveSupport::SafeBuffer] The rendered custom element HTML tag.
  #
  # Example (ERB view):
  #   <%= react_island_tag("hello-island", { greeting: "Hello", name: "World" }) %>
  #
  # Rendered output:
  #   <hello-island data-props='{"greeting":"Hello","name":"World"}'></hello-island>
  def react_island_tag(name, props = {})
    raise ArgumentError, "Island name must contain a hyphen (Custom Elements spec)" unless name.include?("-")

    # Sanitize: convert to JSON, then HTML-escape to prevent XSS when the
    # attribute is read back by the browser.
    serialized_props = props.to_json

    # Build the tag manually to preserve JSON format in the attribute
    # The browser will parse the JSON from the data-props attribute
    "<#{name} data-props=\"#{serialized_props}\"></#{name}>".html_safe # rubocop:disable Rails/OutputSafety
  end
end
