# frozen_string_literal: true

class ExercisesController < ApplicationController
  before_action :authenticate_user!, except: %i[index show start practice]
  before_action :set_exercise, only: %i[show edit update destroy start]
  after_action :verify_authorized, except: %i[index practice]

  # GET /exercises
  def index
    @exercises = Exercise.regular.order(created_at: :desc)
    respond_to do |format|
      format.html
      format.json { render json: @exercises }
    end
  end

  # GET /exercises/:id
  def show
    authorize @exercise
    respond_to do |format|
      format.html
      format.json { render json: @exercise }
    end
  end

  # GET /exercises/new
  def new
    @exercise = Exercise.new
    authorize @exercise
    @tags = Tag.all
    @questions = Question.all
  end

  # GET /exercises/:id/edit
  def edit
    authorize @exercise
    @tags = Tag.all
    @questions = Question.all
  end

  # POST /exercises
  def create
    @exercise = Exercise.new(exercise_params)
    authorize @exercise

    if @exercise.save
      render json: @exercise, status: :created, location: @exercise
    else
      render json: @exercise.errors, status: :unprocessable_content
    end
  end

  # PATCH/PUT /exercises/:id
  def update
    authorize @exercise

    if @exercise.update(exercise_params)
      render json: @exercise
    else
      render json: @exercise.errors, status: :unprocessable_content
    end
  end

  # DELETE /exercises/:id
  def destroy
    authorize @exercise
    @exercise.destroy
    redirect_to exercises_url, notice: "Exercise was successfully destroyed."
  end

  # GET /exercises/:id/start
  def start
    authorize @exercise
    @resolved_questions = ExerciseResolver.new(@exercise.spec).resolve

    respond_to do |format|
      format.html # Renders start.html.erb with interactive-player
      format.json do
        render json: { title: @exercise.title, questions: @resolved_questions }
      end
    end
  end

  # GET /exercises/practice
  # Generate and start a practice exercise based on weak areas or specified tags/questions
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
      redirect_to start_exercise_path(@exercise), notice: "Practice exercise created! Let's begin."
    else
      redirect_to dashboard_analytics_path, alert: "No practice questions available. Keep practicing to unlock more!"
    end
  end

  private

  def set_exercise
    @exercise = Exercise.find_by_uuid_or_slug_or_id(params[:id])

    return if @exercise

    redirect_to exercises_path, alert: "Exercise not found."
  end

  def exercise_params
    params.require(:exercise).permit(:title,
                                     spec: [{ selection_rules: %i[type tag_uuid count strategy question_uuid] }])
  end
end
