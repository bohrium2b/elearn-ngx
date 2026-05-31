module QuestionsHelper
  def render_quiz_island(component_tag, record)
    # package database content into a structured format
    config_payload = {
      questionId: record.question_id_code,
      question: record.config_data&.fetch("question", ""),
      choices: record.config_data&.fetch("choices", []),
      hints: record.config_data&.fetch("hints", []),
      numChoices: record.config_data&.fetch("numChoices", 1)
    }

    # Output a native Web Component tag containing the JSON payload safely escaped
    # Use the shared `react_island_tag` helper so the payload is placed in
    # the `data-props` attribute (what `web_components.ts` expects).
    react_island_tag(component_tag, { question: config_payload })
  end
end
