# frozen_string_literal: true

class QuestionsController < ApplicationController
  before_action :authenticate_user!, except: %i[index show]
  before_action :set_question, only: %i[show edit update destroy]
  after_action :verify_authorized, except: :index

  def index
    @questions = Question.all
    render json: @questions.map { |question| serialize_question(question) }
  end

  def show
    authorize @question
    respond_to do |format|
      format.html { render :show }
      format.json { render json: serialize_question(@question) }
    end
  end

  def new
    @question = Question.new
    authorize @question
    @sample_question = build_sample_question
  end

  def edit
    authorize @question
    @sample_question = @question.presence || build_sample_question
  end

  def create
    @question = Question.new
    authorize @question
    payload = question_params

    question_config = build_question_config(payload)
    if (validation_error = validate_question_config(question_config))
      return render_question_validation_error(validation_error, :new)
    end

    if @question.save
      @question.update(config_data: question_config, slug: payload.fetch(:slug, ""))
      handle_create_response
    else
      render :new, status: :unprocessable_content
    end
  end

  def update
    authorize @question
    payload = question_params
    question_config = build_question_config(payload)

    if (validation_error = validate_question_config(question_config))
      return render_question_validation_error(validation_error, :edit)
    end

    if @question.update(config_data: question_config, slug: payload.fetch(:slug, ""))
      handle_update_response
    else
      render :edit, status: :unprocessable_content
    end
  end

  def destroy
    authorize @question
    if @question.destroy
      handle_destroy_response
    else
      handle_destroy_error
    end
  end

  private

  def set_question
    @question = find_question_by_param(params[:id])
  end

  def find_question_by_param(param)
    key = param.to_s
    if key.length >= 36
      uuid_candidate = key[0, 36]
      q = Question.find_by(uuid: uuid_candidate)
      return q if q
    end
    Question.find_by(uuid: key) || Question.find_by(slug: key) || Question.find(key)
  end

  def question_params
    params.permit(:question, :numChoices, :slug, choices: %i[content correct rationale], hints: [])
  end

  def build_question_config(payload)
    {
      question: payload.fetch(:question, ""),
      choices: payload.fetch(:choices, []),
      hints: payload.fetch(:hints, []),
      numChoices: payload.fetch(:numChoices, 1),
      type: "multi-choice"
    }
  end

  def build_sample_question
    Question.new(
      config_data: {
        question: "Question text goes here",
        choices: [{ content: "Choice A", correct: true }, { content: "Choice B", correct: false },
                  { content: "Choice C", correct: false }],
        hints: ["Hint 1", "Hint 2", "Hint 3"],
        numChoices: 1,
        type: "multi-choice"
      },
      slug: "question-#{SecureRandom.hex(4)}"
    )
  end

  def validate_question_config(question_config)
    question_text = question_config[:question].to_s.strip
    choices = Array(question_config[:choices])
    return "Question must be at least 10 characters long." if question_text.length < 10
    return "Question must include at least two choices." if choices.length < 2
    unless choices.any? { |choice| ActiveModel::Type::Boolean.new.cast(choice[:correct] || choice["correct"]) }
      return "Question must have at least one correct choice."
    end

    nil
  end

  def render_question_validation_error(message, template)
    if request.content_type&.include?("application/json")
      render json: { status: "error", message: message }, status: :unprocessable_content
    else
      flash.now[:alert] = message
      render template, status: :unprocessable_content
    end
  end

  def handle_create_response
    if request.content_type&.include?("application/json")
      render json: { redirected: true, url: question_url(@question) }, status: :ok
    else
      redirect_to @question, notice: t("messages.question_created")
    end
  end

  def handle_update_response
    if request.content_type&.include?("application/json")
      if request.headers["X-Inline-Edit"] == "true"
        render json: { question: serialize_question(@question) }, status: :ok
      else
        render json: { redirected: true, url: question_url(@question) }, status: :ok
      end
    else
      redirect_to @question, notice: t("messages.question_updated")
    end
  end

  def handle_destroy_response
    if request.format.json? || request.content_type&.include?("application/json")
      render json: { status: "success" }, status: :ok
    else
      redirect_to questions_url, notice: t("messages.question_deleted")
    end
  end

  def handle_destroy_error
    if request.format.json? || request.content_type&.include?("application/json")
      render json: { status: "error", message: @question.errors.full_messages.to_sentence },
             status: :unprocessable_content
    else
      redirect_to questions_url, alert: @question.errors.full_messages.to_sentence
    end
  end

  def serialize_question(question)
    config_data = question.config_data || {}
    {
      id: question.id,
      uuid: question.uuid,
      slug: question.slug,
      code: question.question_id_code,
      label: question.question_id_code.presence || question.slug || "Question #{question.id}",
      question: config_data["question"],
      choices: config_data["choices"] || [],
      hints: config_data["hints"] || [],
      numChoices: config_data["numChoices"] || 1,
      showPath: question_path(question),
      updatePath: question_path(question),
      source_tag_id: nil
    }
  end
end
