# frozen_string_literal: true

module Admin
  class TaxonomyNodesController < ApplicationController
    before_action :authenticate_user!
    before_action :require_admin!
    before_action :set_taxonomy_node, only: %i[show update destroy reorder move]

    # GET /admin/taxonomy_nodes
    def index
      @nodes = TaxonomyNode.ordered

      respond_to do |format|
        format.html # Renders index.html.erb
        format.json { render json: @nodes.map { |n| serialize_node(n) } }
      end
    end

    # GET /admin/taxonomy_nodes/assemble
    def assemble
      # Renders the course assembly dashboard
    end

    # GET /admin/taxonomy_nodes/:id
    def show
      render json: serialize_node(@node)
    end

    # POST /admin/taxonomy_nodes
    def create
      @node = TaxonomyNode.new(taxonomy_node_params)

      if @node.save
        render json: serialize_node(@node), status: :created
      else
        render json: { errors: @node.errors.full_messages }, status: :unprocessable_content
      end
    end

    # PATCH/PUT /admin/taxonomy_nodes/:id
    def update
      if @node.update(taxonomy_node_params)
        render json: serialize_node(@node)
      else
        render json: { errors: @node.errors.full_messages }, status: :unprocessable_content
      end
    end

    # DELETE /admin/taxonomy_nodes/:id
    def destroy
      @node.destroy
      head :no_content
    end

    # PATCH /admin/taxonomy_nodes/:id/reorder
    def reorder
      new_position = params[:position].to_i
      # Logic to reorder node among siblings
      render json: serialize_node(@node)
    end

    # PATCH /admin/taxonomy_nodes/:id/move
    def move
      new_parent = TaxonomyNode.find_by(move_params[:new_parent_id])
      @node.update(parent: new_parent, course: new_parent.course)
      render json: serialize_node(@node)
    end

    # GET /admin/taxonomy_nodes/full_tree
    def full_tree
      @courses = TaxonomyNode.course.roots.ordered.includes(children: { children: { children: :questions } })
      render json: serialize_full_tree(@courses)
    end

    private

    def set_taxonomy_node
      @node = TaxonomyNode.find_by_param(params[:id])
      render json: { error: "Not found" }, status: :not_found unless @node
    end

    def taxonomy_node_params
      params.require(:taxonomy_node).permit(:name, :slug, :level, :parent_id, :course_id, :position, :description,
                                            metadata: {})
    end

    def move_params
      params.require(:move).permit(:new_parent_id)
    end

    def require_admin!
      render json: { error: "Unauthorized" }, status: :forbidden unless current_user&.admin?
    end

    def serialize_node(node)
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

    def serialize_full_tree(courses)
      courses.map do |course|
        serialized = serialize_node(course)
        serialized[:parts] = serialize_children(course.children.ordered)
        serialized
      end
    end

    def serialize_children(nodes)
      nodes.map do |node|
        serialized = serialize_node(node)
        if node.part?
          serialized[:units] = serialize_children(node.children.ordered) if node.children.any?
        elsif node.unit?
          serialized[:topics] = serialize_children(node.children.ordered) if node.children.any?
        elsif node.topic?
          serialized[:questions] = node.questions.map { |q| serialize_question(q) } if node.questions.any?
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
        question: question.config_data&.dig("question")&.truncate(100),
        type: question.config_data&.dig("type")
      }
    end
  end
end
