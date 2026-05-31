class QuestionsController < ApplicationController
  def index
    @questions = Question.all
    @sample_question = Question.new(
      config_data: {
        question: "What is $2 + 2x?$",
        choices: [{ content: "3", correct: false }, { content: "4", correct: true }, { content: "5", correct: false }],
        hints: ["It's more than 3", "It's less than 5"],
        numChoices: 1,
        type: "multi-choice"
      }
    )
  end

  def show
    @question = find_question_by_param(params[:id])
  end

  def new
    @question = Question.new
    @sample_question = Question.new(
      config_data: {
        question: "Question text goes here",
        choices: [{ content: "Choice A", correct: true }, { content: "Choice B", correct: false },
                  { content: "Choice C", correct: false }],
        hints: ["Hint 1", "Hint 2", "Hint 3"],
        numChoices: 1,
        type: "multi-choice"
      }
    )
  end

  def edit
    @question = find_question_by_param(params[:id])
    @sample_question = @question || Question.new(
      config_data: {
        question: "Question text goes here",
        choices: [{ content: "Choice A", correct: true }, { content: "Choice B", correct: false },
                  { content: "Choice C", correct: false }],
        hints: ["Hint 1", "Hint 2", "Hint 3"],
        numChoices: 1,
        type: "multi-choice"
      }
    )
  end

  def create
    @question = Question.new
    puts "Received question data: #{params.inspect}"
    payload = params.permit(:question, :numChoices, choices: %i[content correct rationale], hints: [])

    question_config = {
      question: payload.fetch(:question, ""),
      choices: payload.fetch(:choices, []),
      hints: payload.fetch(:hints, []),
      numChoices: payload.fetch(:numChoices, 1),
      type: "multi-choice"
    }

    if @question.save
      @question.update(config_data: question_config)
      if request.content_type&.include?("application/json")
        render json: { redirected: true, url: question_url(@question) }, status: :ok
      else
        redirect_to @question, notice: "Question was successfully created."
      end
    else
      render :new, status: :unprocessable_content
    end
  end

  def update
    @question = find_question_by_param(params[:id])
    payload = params.permit(:question, :numChoices, choices: %i[content correct rationale], hints: [])
    question_config = {
      question: payload.fetch(:question, ""),
      choices: payload.fetch(:choices, []),
      hints: payload.fetch(:hints, []),
      numChoices: payload.fetch(:numChoices, 1),
      type: "multi-choice"
    }
    if @question.update(config_data: question_config)
      if request.content_type&.include?("application/json")
        render json: { redirected: true, url: question_url(@question) }, status: :ok
      else
        redirect_to @question, notice: "Question was successfully updated."
      end
    else
      render :edit, status: :unprocessable_content
    end
  end

  def destroy
    @question = find_question_by_param(params[:id])
    @question.destroy
    redirect_to questions_url, notice: "Question was successfully deleted."
  end

  private

  def find_question_by_param(param)
    key = param.to_s

    # If param contains our `uuid-slug` format, the uuid is the first 36 chars
    if key.length >= 36
      uuid_candidate = key[0, 36]
      q = Question.find_by(uuid: uuid_candidate)
      return q if q
    end

    # Try uuid directly, then slug, then fallback to id
    Question.find_by(uuid: key) || Question.find_by(slug: key) || Question.find(key)
  end
end
