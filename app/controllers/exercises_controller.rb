# frozen_string_literal: true

class ExercisesController < ApplicationController
  # GET /exercises
  def index
    @exercises = Exercise.order(created_at: :desc)
    respond_to do |format|
      format.html
      format.json { render json: @exercises }
    end
  end

  # GET /exercises/new
  def new
    @tags = Tag.all
    @questions = Question.all
    Rails.logger.debug { "Available questions: #{JSON.pretty_generate(@questions.as_json)}" }
  end

  # GET /exercises/:id/edit
  def edit
    @exercise = Exercise.find(params[:id])
    @tags = Tag.all
    @questions = Question.all
  end

  # POST /exercises
  def create
    @exercise = Exercise.new(exercise_params)

    if @exercise.save
      render json: @exercise, status: :created, location: @exercise
    else
      render json: @exercise.errors, status: :unprocessable_content
    end
  end

  # PATCH/PUT /exercises/:id
  def update
    @exercise = Exercise.find(params[:id])

    if @exercise.update(exercise_params)
      render json: @exercise
    else
      render json: @exercise.errors, status: :unprocessable_content
    end
  end

  # GET /exercises/:id/start
  def start
    @exercise = Exercise.find(params[:id])
    @resolved_questions = ExerciseResolver.new(@exercise.spec).resolve

    respond_to do |format|
      format.html # Renders start.html.erb with interactive-player
      format.json do
        render json: { title: @exercise.title, questions: @resolved_questions }
      end
    end
  end

  private

  def exercise_params
    params.require(:exercise).permit(:title,
                                     spec: [{ selection_rules: %i[type tag_uuid count strategy question_uuid] }])
  end
end
