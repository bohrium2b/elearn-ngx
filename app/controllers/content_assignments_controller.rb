# frozen_string_literal: true

class ContentAssignmentsController < ApplicationController
  before_action :set_content_assignment, only: %i[update destroy]

  # POST /content_assignments
  def create
    @assignment = ContentAssignment.new(content_assignment_params)

    if @assignment.save
      render json: serialize_assignment(@assignment), status: :created
    else
      render json: { errors: @assignment.errors.full_messages }, status: :unprocessable_content
    end
  end

  # PATCH/PUT /content_assignments/:id
  def update
    if @assignment.update(content_assignment_params)
      render json: serialize_assignment(@assignment)
    else
      render json: { errors: @assignment.errors.full_messages }, status: :unprocessable_content
    end
  end

  # DELETE /content_assignments/:id
  def destroy
    @assignment.destroy
    head :no_content
  end

  private

  def set_content_assignment
    @assignment = ContentAssignment.find(params[:id])
  end

  def content_assignment_params
    params.require(:content_assignment).permit(:taxonomy_node_id, :question_id, :position)
  end

  def serialize_assignment(assignment)
    {
      id: assignment.id,
      taxonomy_node_id: assignment.taxonomy_node_id,
      question_id: assignment.question_id,
      position: assignment.position,
      created_at: assignment.created_at
    }
  end
end
