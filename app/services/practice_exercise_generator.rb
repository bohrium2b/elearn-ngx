# frozen_string_literal: true

class PracticeExerciseGenerator
  DEFAULT_QUESTION_COUNT = 10

  def initialize(user)
    @user = user
  end

  # Generate a practice exercise based on weak areas or specific tags/questions
  def generate(tag_uuids: nil, question_uuids: nil, question_count: DEFAULT_QUESTION_COUNT)
    questions = if question_uuids.present?
                  fetch_specific_questions(question_uuids)
                elsif tag_uuids.present?
                  fetch_questions_from_tags(tag_uuids, question_count)
                else
                  fetch_weak_area_questions(question_count)
                end

    return nil if questions.empty?

    build_exercise(questions)
  end

  # Create a persistent practice exercise
  def create_practice_exercise!(tag_uuids: nil, question_uuids: nil, question_count: DEFAULT_QUESTION_COUNT)
    exercise_data = generate(
      tag_uuids: tag_uuids,
      question_uuids: question_uuids,
      question_count: question_count
    )

    return nil unless exercise_data

    Exercise.create!(
      title: exercise_data[:title],
      spec: exercise_data[:spec],
      is_practice: true
    )
  end

  private

  def fetch_specific_questions(question_uuids)
    Question.includes(:tags).where(uuid: question_uuids).distinct
  end

  def fetch_questions_from_tags(tag_uuids, count)
    tags = Tag.where(uuid: tag_uuids)
    return Question.none if tags.empty?

    # Get all questions from the tag branches
    question_ids = tags.flat_map do |tag|
      (tag.questions + tag.all_descendants.flat_map(&:questions)).uniq
    end.map(&:id)

    # Exclude already attempted questions
    attempted_ids = @user.assessment_sessions.flat_map(&:question_uuids)

    # Use subquery to avoid DISTINCT + ORDER BY RANDOM() issue
    Question.includes(:tags)
            .where(id: Question.where(id: question_ids)
                                .where.not(uuid: attempted_ids)
                                .select(:id)
                                .order(Arel.sql('RANDOM()'))
                                .limit(count))
            .distinct
  end

  def fetch_weak_area_questions(count)
    weak_tags = identify_weak_tags
    return Question.none if weak_tags.empty?

    tag_uuids = weak_tags.map { |t| t[:uuid] }
    fetch_questions_from_tags(tag_uuids, count)
  end

  def identify_weak_tags
    tag_scores = {}

    @user.assessment_sessions.recent.find_each do |session|
      session.question_responses.each do |qr|
        uuid = qr["question_uuid"]
        question = Question.find_by(uuid: uuid)
        next unless question

        question.tags.each do |tag|
          tag_scores[tag.uuid] ||= { name: tag.name, uuid: tag.uuid, correct: 0, total: 0 }
          tag_scores[tag.uuid][:total] += 1
          tag_scores[tag.uuid][:correct] += 1 if qr["correct"] == true
        end
      end
    end

    # Return tags with < 60% success rate, sorted weakest first
    tag_scores
      .select { |_uuid, perf| perf[:total] >= 2 }
      .map { |_uuid, perf| perf.merge(success_rate: (perf[:correct].to_f / perf[:total]) * 100) }
      .sort_by { |t| t[:success_rate] }
      .first(5)
  end

  def build_exercise(questions)
    tag_names = extract_tag_names(questions)
    title = tag_names.any? ? "Practice: #{tag_names.first(3).join(', ')}" : "Practice Exercise"

    {
      title: title,
      description: "This exercise targets your weak areas to help you improve.",
      questions: questions.map { |q| question_to_plain_text_data(q) },
      spec: build_spec(questions),
      question_count: questions.count
    }
  end

  def extract_tag_names(questions)
    return [] if questions.blank?

    questions.flat_map { |q| q.tags&.map(&:name) || [] }.uniq
  end

  def build_spec(questions)
    {
      selection_rules: questions.map do |q|
        {
          type: "static_question",
          question_uuid: q.uuid
        }
      end
    }
  end

  def question_to_plain_text_data(question)
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
