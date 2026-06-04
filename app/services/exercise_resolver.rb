# frozen_string_literal: true

class ExerciseResolver
  def initialize(spec)
    @spec = spec
    @selected_question_ids = []
    @resolved_questions = []
  end

  def resolve
    return [] unless @spec && @spec["selection_rules"].is_a?(Array)

    @spec["selection_rules"].each do |rule|
      process_rule(rule)
    end

    @resolved_questions
  end

  private

  def process_rule(rule)
    case rule["type"]
    when "dynamic_tag"
      process_dynamic_tag(rule)
    when "static_question"
      process_static_question(rule)
    end
  end

  def process_dynamic_tag(rule)
    tag = Tag.find_by(uuid: rule["tag_uuid"])
    return unless tag

    available_questions = fetch_available_questions(tag)
    sample_count = calculate_sample_count(rule["count"], available_questions.count)
    sampled_questions = available_questions.sample(sample_count)

    add_questions_to_results(sampled_questions)
  end

  def fetch_available_questions(tag)
    questions_in_branch = (tag.questions + tag.all_descendants.flat_map(&:questions)).uniq
    questions_in_branch.reject { |q| @selected_question_ids.include?(q.id) }
  end

  def calculate_sample_count(requested_count, available_count)
    [requested_count, available_count].min
  end

  def add_questions_to_results(questions)
    questions.each do |question|
      @selected_question_ids << question.id
      @resolved_questions << question_to_plain_text_data(question)
    end
  end

  def process_static_question(rule)
    question = Question.find_by(uuid: rule["question_uuid"])
    return unless question
    return if @selected_question_ids.include?(question.id)

    @selected_question_ids << question.id
    @resolved_questions << question_to_plain_text_data(question)
  end

  def question_to_plain_text_data(question)
    # Extract data from config_data or use defaults
    config = question.config_data || {}
    {
      uuid: question.uuid,
      content: config["question"] || "Question content for #{question.uuid}",
      options: config["choices"] || [],
      hints: config["hints"] || [],
      numChoices: config["numChoices"] || 1,
      type: config["type"] || "multi-choice"
    }
  end
end
