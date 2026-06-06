class WorkspaceController < ApplicationController
  before_action :authenticate_user!, except: [:show]
  after_action :verify_authorized

  def show
    authorize :workspace, :show?
    @untagged_questions = Question.untagged
    @tree_data = Tag.where(parent_id: nil).map { |root_tag| assemble_tree_node(root_tag) }

    respond_to do |format|
      format.html
      format.json { render json: build_workspace_payload }
    end
  end

  def update
    authorize :workspace, :update?
    # Update workspace logic
    redirect_to workspace_path, notice: "Workspace updated successfully."
  end

  private

  def build_workspace_payload
    {
      treeData: Tag.where(parent_id: nil).map { |root_tag| assemble_tree_node(root_tag) },
      untaggedQuestions: Question.untagged.map { |question| assemble_question_node(question) }
    }
  end

  def assemble_tree_node(tag)
    {
      id: tag.id,
      uuid: tag.uuid,
      slug: tag.slug,
      name: tag.name,
      color: tag.color,
      permalink: tag_path(tag),
      subtags: tag.children.includes(:children, :questions).map { |child| assemble_tree_node(child) },
      questions: tag.questions.map { |question| assemble_question_node(question, tag) }
    }
  end

  def assemble_question_node(question, tag = nil)
    config_data = question.config_data || {}
    {
      id: question.id,
      uuid: question.uuid,
      slug: question.slug,
      code: question.question_id_code,
      label: question.question_id_code.presence || question.slug || "Question #{question.id}",
      question: config_data["question"],
      choices: config_data["choices"] || [],
      hints: config_data["hints"] || [],
      numChoices: config_data["numChoices"] || 1,
      showPath: question_path(question),
      updatePath: question_path(question),
      source_tag_id: tag&.id
    }
  end
end
