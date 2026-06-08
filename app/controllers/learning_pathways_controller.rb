# frozen_string_literal: true

class LearningPathwaysController < ApplicationController
  before_action :authenticate_user!
  before_action :set_course, only: %i[show progress start_topic complete_topic]

  # GET /learning_pathways
  def index
    @courses = TaxonomyNode.courses.ordered
    # If is html request, render the index view. If it's JSON (API), render the courses as JSON.
    respond_to do |format|
      format.html # Renders index.html.erb
      format.json { render json: @courses.map { |c| serialize_course_summary(c) } }
    end
  end

  # GET /learning_pathways/:id
  def show
    respond_to do |format|
      format.html # Renders show.html.erb
      format.json { render json: serialize_course_detail(@course) }
    end
  end

  # GET /learning_pathways/:id/progress
  def progress
    user_progress = calculate_user_progress(@course, current_user)
    render json: user_progress
  end

  # POST /learning_pathways/:id/start_topic
  def start_topic
    topic = TaxonomyNode.find_by_param(params[:topic_id])
    # Logic to mark topic as started for user
    render json: { status: "started", topic_id: topic.id }
  end

  # POST /learning_pathways/:id/complete_topic
  def complete_topic
    topic = TaxonomyNode.find_by_param(params[:topic_id])
    # Logic to mark topic as completed for user
    render json: { status: "completed", topic_id: topic.id }
  end

  private

  def set_course
    @course = TaxonomyNode.courses.find_by_param(params[:id])
    render json: { error: "Course not found" }, status: :not_found unless @course
  end

  def serialize_course_summary(course)
    {
      id: course.id,
      uuid: course.uuid,
      slug: course.slug,
      path_identifier: course.path_identifier,
      name: course.name,
      description: course.description,
      parts_count: course.children.select { |c| c.part? }.count,
      units_count: course.children.flat_map { |p| p.children.select { |c| c.unit? } }.count,
      topics_count: course.descendants.select { |c| c.topic? }.count,
      questions_count: course.descendants.select { |c| c.topic? }.flat_map { |t| t.questions }.uniq.count
    }
  end

  def serialize_course_detail(course)
    serialized = serialize_course_summary(course)
    serialized[:parts] = course.children.select { |c| c.part? }.sort_by { |p| [p.position, p.name] }.map do |part|
      part_serialized = {
        id: part.id,
        uuid: part.uuid,
        slug: part.slug,
        path_identifier: part.path_identifier,
        name: part.name,
        description: part.description,
        position: part.position,
        units: part.children.select { |c| c.unit? }.sort_by { |u| [u.position, u.name] }.map do |unit|
          unit_serialized = {
            id: unit.id,
            uuid: unit.uuid,
            slug: unit.slug,
            path_identifier: unit.path_identifier,
            name: unit.name,
            description: unit.description,
            position: unit.position,
            topics: unit.children.select { |c| c.topic? }.sort_by { |t| [t.position, t.name] }.map do |topic|
              {
                id: topic.id,
                uuid: topic.uuid,
                slug: topic.slug,
                path_identifier: topic.path_identifier,
                name: topic.name,
                description: topic.description,
                position: topic.position,
                questions_count: topic.questions.count,
                tags: topic.tags.map { |t| { id: t.id, name: t.name, color: t.color } }
              }
            end
          }
          unit_serialized
        end
      }
      part_serialized
    end
    serialized
  end

  def calculate_user_progress(course, user)
    # Placeholder for progress calculation
    topics = course.descendants.select { |c| c.topic? }
    {
      total_topics: topics.count,
      completed_topics: 0,
      percentage: 0
    }
  end
end
