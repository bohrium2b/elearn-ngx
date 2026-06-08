# frozen_string_literal: true

class TaxonomyNodesController < ApplicationController
  before_action :set_taxonomy_node, only: %i[show update destroy descendants ancestors questions]

  # GET /taxonomy
  def index
    @nodes = TaxonomyNode.roots.ordered.includes(:children)
    render json: serialize_tree(@nodes)
  end

  # GET /taxonomy/:id
  def show
    Rails.logger.info "Showing taxonomy node: #{@taxonomy_node.inspect}"
    render json: serialize_node(@taxonomy_node)
  end

  # POST /taxonomy
  def create
    @node = TaxonomyNode.new(taxonomy_node_params)

    if @node.save
      render json: serialize_node(@node), status: :created
    else
      render json: { errors: @node.errors.full_messages }, status: :unprocessable_content
    end
  end

  # PATCH/PUT /taxonomy/:id
  def update
    if @node.update(taxonomy_node_params)
      render json: serialize_node(@node)
    else
      render json: { errors: @node.errors.full_messages }, status: :unprocessable_content
    end
  end

  # DELETE /taxonomy/:id
  def destroy
    @node.destroy
    head :no_content
  end

  # GET /taxonomy/:id/descendants
  def descendants
    render json: serialize_tree(@node.descendants)
  end

  # GET /taxonomy/:id/ancestors
  def ancestors
    render json: @node.ancestors.map { |a| serialize_node(a) }
  end

  # GET /taxonomy/:id/questions
  def questions
    @questions = @taxonomy_node.questions.includes(:tags)
    render json: @questions.map { |q| serialize_question(q) }
  end

  # GET /taxonomy/tree
  def tree
    @courses = TaxonomyNode.courses.roots.ordered
    render json: serialize_full_tree(@courses)
  end

  # GET /taxonomy/by_level
  def by_level
    level = params[:level]
    return render json: { error: "Invalid level" }, status: :bad_request unless TaxonomyNode.levels.key?(level)

    @nodes = TaxonomyNode.by_level(level).ordered
    render json: @nodes.map { |n| serialize_node(n) }
  end

  private

  def set_taxonomy_node
    Rails.logger.info "Finding taxonomy node with id: #{params[:id]}"
    @taxonomy_node = TaxonomyNode.find_by_param(params[:id])
    Rails.logger.info "Found taxonomy node: #{@taxonomy_node.inspect}" if @taxonomy_node
    return if @taxonomy_node

    render json: { error: "Not found" }, status: :not_found
    nil
  end

  def taxonomy_node_params
    params.require(:taxonomy_node).permit(:name, :slug, :level, :parent_id, :course_id, :position, :description,
                                          metadata: {})
  end

  def serialize_node(node)
    Rails.logger.info "Serializing node: #{node.inspect}"
    {
      id: node.id,
      uuid: node.uuid,
      slug: node.slug,
      path_identifier: node.path_identifier,
      name: node.name,
      level: node.level,
      parent_id: node.parent_id,
      course_id: node.course_id,
      position: node.position,
      description: node.description,
      metadata: node.metadata,
      children_count: node.children.count,
      questions_count: node.questions.count,
      created_at: node.created_at,
      updated_at: node.updated_at
    }
  end

  def serialize_tree(nodes)
    nodes.map { |node| serialize_node_with_children(node) }
  end

  def serialize_node_with_children(node)
    serialized = serialize_node(node)
    serialized[:children] = node.children.ordered.map { |child| serialize_node_with_children(child) }
    serialized
  end

  def serialize_full_tree(courses)
    courses.map do |course|
      serialized = serialize_node(course)
      serialized[:parts] = course.children.parts.ordered.map do |part|
        part_serialized = serialize_node(part)
        part_serialized[:units] = part.children.units.ordered.map do |unit|
          unit_serialized = serialize_node(unit)
          unit_serialized[:topics] = unit.children.topics.ordered.map do |topic|
            topic_serialized = serialize_node(topic)
            topic_serialized[:questions] = topic.questions.map { |q| serialize_question(q) }
            topic_serialized
          end
          unit_serialized
        end
        part_serialized
      end
      serialized
    end
  end

  def serialize_question(question)
    {
      id: question.id,
      uuid: question.uuid,
      slug: question.slug,
      path_identifier: question.to_param,
      question: question.config_data&.dig("question"),
      type: question.config_data&.dig("type"),
      tags: question.tags.map { |t| { id: t.id, name: t.name, color: t.color } }
    }
  end
end
