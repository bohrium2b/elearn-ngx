# frozen_string_literal: true

module Admin
  class TaxonomyNodesController < AuthenticatedController
    before_action :set_taxonomy_node, only: %i[show update destroy reorder move]

    def index
      authorize TaxonomyNode
      @nodes = TaxonomyNode.ordered

      respond_to do |format|
        format.html
        format.json { render json: @nodes.map { |n| serialize_node(n) } }
      end
    end

    def assemble
      authorize TaxonomyNode
    end

    def show
      authorize @node
      render json: serialize_node(@node)
    end

    def create
      authorize TaxonomyNode
      @node = TaxonomyNode.new(taxonomy_node_params)

      if @node.save
        render json: serialize_node(@node), status: :created
      else
        render json: { errors: @node.errors.full_messages }, status: :unprocessable_content
      end
    end

    def update
      authorize @node
      if @node.update(taxonomy_node_params)
        render json: serialize_node(@node)
      else
        render json: { errors: @node.errors.full_messages }, status: :unprocessable_content
      end
    end

    def destroy
      authorize @node
      @node.destroy
      head :no_content
    end

    def reorder
      authorize @node
      if @node.update(position: params[:position].to_i)
        render json: serialize_node(@node)
      else
        render json: { errors: @node.errors.full_messages }, status: :unprocessable_content
      end
    end

    def move
      authorize @node
      new_parent = TaxonomyNode.find_by_param(params.require(:move).require(:new_parent_id))
      return render json: { error: "Parent node not found" }, status: :not_found unless new_parent

      if @node.update(parent: new_parent, course: new_parent.course)
        render json: serialize_node(@node)
      else
        render json: { errors: @node.errors.full_messages }, status: :unprocessable_content
      end
    end

    def full_tree
      authorize TaxonomyNode
      @courses = TaxonomyNode.course.roots.ordered.includes(children: { children: { children: :questions } })
      render json: serialize_full_tree(@courses)
    end

    private

    def set_taxonomy_node
      @node = TaxonomyNode.find_by_param(params[:id])
      return render json: { error: "Not found" }, status: :not_found unless @node
    end

    def taxonomy_node_params
      params.require(:taxonomy_node).permit(:name, :slug, :level, :parent_id, :course_id, :position, :description,
                                            metadata: {})
    end

    def move_params
      params.require(:move).permit(:new_parent_id)
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
        serialized[:units] = serialize_children(node.children.ordered) if node.part? && node.children.any?
        serialized[:topics] = serialize_children(node.children.ordered) if node.unit? && node.children.any?
        serialized[:questions] = node.questions.map { |q| serialize_question(q) } if node.topic? && node.questions.any?
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
