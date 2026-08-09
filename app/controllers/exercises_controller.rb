# frozen_string_literal: true

class ExercisesController < AuthenticatedController
  skip_before_action :authenticate_user!, only: %i[index show start practice]
  skip_after_action :verify_authorized, only: %i[index practice]
  before_action :set_exercise, only: %i[show edit update destroy start]

  def index
    @exercises = Exercise.regular.order(created_at: :desc)
    respond_to do |format|
      format.html
      format.json { render json: @exercises }
    end
  end

  def show
    authorize @exercise
    respond_to do |format|
      format.html
      format.json { render json: @exercise }
      format.any { render json: @exercise }
    end
  end

  def new
    @exercise = Exercise.new
    authorize @exercise
    @tags = Tag.all
    @questions = Question.all
  end

  def edit
    authorize @exercise
    @tags = Tag.all
    @questions = Question.all
  end

  def create
    @exercise = Exercise.new(exercise_params)
    authorize @exercise

    if @exercise.save
      render json: @exercise, status: :created, location: @exercise
    else
      render json: @exercise.errors, status: :unprocessable_content
    end
  end

  def update
    authorize @exercise

    if @exercise.update(exercise_params)
      render json: @exercise
    else
      render json: @exercise.errors, status: :unprocessable_content
    end
  end

  def destroy
    authorize @exercise
    @exercise.destroy
    redirect_to exercises_url, notice: t("messages.exercise_destroyed")
  end

  def start
    authorize @exercise
    @resolved_questions = ExerciseResolver.new(@exercise.spec).resolve

    respond_to do |format|
      format.html
      format.json do
        render json: { title: @exercise.title, questions: @resolved_questions }
      end
    end
  end

  def practice
    tag_uuids = params[:tags].presence&.split(",")
    question_uuids = params[:questions].presence&.split(",")
    question_count = params[:count].present? ? params[:count].to_i : PracticeExerciseGenerator::DEFAULT_QUESTION_COUNT

    generator = PracticeExerciseGenerator.new(current_user)
    @exercise = generator.create_practice_exercise!(
      tag_uuids: tag_uuids,
      question_uuids: question_uuids,
      question_count: question_count
    )

    if @exercise
      redirect_to start_exercise_path(@exercise), notice: t("messages.practice_created")
    else
      redirect_to dashboard_analytics_path, alert: t("messages.no_practice_questions")
    end
  end

  private

  def set_exercise
    @exercise = Exercise.find_by_uuid_or_slug_or_id(params[:id])
    return if @exercise

    redirect_to exercises_path, alert: t("messages.exercise_not_found")
  end

  def exercise_params
    params.require(:exercise).permit(:title,
                                     spec: [{ selection_rules: %i[type tag_uuid count strategy question_uuid] }])
  end
end
