# frozen_string_literal: true

class LearningPathwaysController < AuthenticatedController
  before_action :set_course, only: %i[show progress start_topic complete_topic]

  def index
    @courses = TaxonomyNode.courses.ordered
    respond_to do |format|
      format.html
      format.json { render json: @courses.map { |c| serialize_course_summary(c) } }
    end
  end

  def show
    respond_to do |format|
      format.html
      format.json { render json: serialize_course_detail(@course) }
    end
  end

  def progress
    user_progress = calculate_user_progress(@course)
    render json: user_progress
  end

  def start_topic
    topic = TaxonomyNode.find_by_param(params[:topic_id])
    return render json: { error: "Topic not found" }, status: :not_found unless topic

    render json: { status: "started", topic_id: topic.id }
  end

  def complete_topic
    topic = TaxonomyNode.find_by_param(params[:topic_id])
    return render json: { error: "Topic not found" }, status: :not_found unless topic

    render json: { status: "completed", topic_id: topic.id }
  end

  private

  def set_course
    @course = TaxonomyNode.courses.find_by_param(params[:id])
    return render json: { error: "Course not found" }, status: :not_found unless @course
  end

  def serialize_course_summary(course)
    {
      id: course.id,
      uuid: course.uuid,
      slug: course.slug,
      path_identifier: course.path_identifier,
      name: course.name,
      description: course.description,
      parts_count: course.children.count(&:part?),
      units_count: course.children.flat_map { |p| p.children.select(&:unit?) }.count,
      topics_count: course.descendants.count(&:topic?),
      questions_count: course.descendants.select(&:topic?).flat_map(&:questions).uniq.count
    }
  end

  def serialize_course_detail(course)
    serialized = serialize_course_summary(course)
    serialized[:parts] = serialize_parts(course)
    serialized
  end

  def serialize_parts(course)
    course.children.select(&:part?).sort_by { |p| [p.position, p.name] }.map do |part|
      part_serialized = serialize_part_node(part)
      part_serialized[:units] = serialize_units(part)
      part_serialized
    end
  end

  def serialize_part_node(part)
    {
      id: part.id,
      uuid: part.uuid,
      slug: part.slug,
      path_identifier: part.path_identifier,
      name: part.name,
      description: part.description,
      position: part.position
    }
  end

  def serialize_units(part)
    part.children.select(&:unit?).sort_by { |u| [u.position, u.name] }.map do |unit|
      unit_serialized = serialize_unit_node(unit)
      unit_serialized[:topics] = serialize_topics(unit)
      unit_serialized
    end
  end

  def serialize_unit_node(unit)
    {
      id: unit.id,
      uuid: unit.uuid,
      slug: unit.slug,
      path_identifier: unit.path_identifier,
      name: unit.name,
      description: unit.description,
      position: unit.position
    }
  end

  def serialize_topics(unit)
    unit.children.select(&:topic?).sort_by { |t| [t.position, t.name] }.map do |topic|
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
  end

  def calculate_user_progress(course)
    topics = course.descendants.select(&:topic?)
    {
      total_topics: topics.count,
      completed_topics: 0,
      percentage: 0
    }
  end
end
