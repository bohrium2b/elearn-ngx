# frozen_string_literal: true

class TopicExercisesController < ApplicationController
  protect_from_forgery with: :null_session
  before_action :set_topic, only: %i[index create]
  before_action :set_topic_exercise, only: [:destroy]

  # GET /topic_exercises?taxonomy_node_id=:id
  def index
    @topic_exercises = if @topic
                         @topic.topic_exercises.includes(:exercise).ordered
                       else
                         TopicExercise.includes(:taxonomy_node, :exercise).ordered.all
                       end

    render json: @topic_exercises.map { |te| serialize_topic_exercise(te) }
  end

  # POST /topic_exercises
  def create
    @topic_exercise = @topic.topic_exercises.build(topic_exercise_params)

    if @topic_exercise.save
      render json: serialize_topic_exercise(@topic_exercise), status: :created
    else
      render json: { errors: @topic_exercise.errors.full_messages }, status: :unprocessable_content
    end
  end

  # DELETE /topic_exercises/:id
  def destroy
    @topic_exercise.destroy
    head :no_content
  end

  private

  def set_topic
    # rubocop:disable Rails/DynamicFindBy
    @topic = TaxonomyNode.find_by_param(params[:taxonomy_node_id]) if params[:taxonomy_node_id]
    # rubocop:enable Rails/DynamicFindBy
  end

  def set_topic_exercise
    @topic_exercise = TopicExercise.find(params[:id])
  end

  def topic_exercise_params
    params.require(:topic_exercise).permit(:exercise_id, :position)
  end

  def serialize_topic_exercise(topic_exercise)
    {
      id: topic_exercise.id,
      taxonomy_node_id: topic_exercise.taxonomy_node_id,
      exercise_id: topic_exercise.exercise_id,
      exercise_name: topic_exercise.exercise.title,
      exercise_slug: topic_exercise.exercise.slug,
      position: topic_exercise.position,
      created_at: topic_exercise.created_at
    }
  end
end
