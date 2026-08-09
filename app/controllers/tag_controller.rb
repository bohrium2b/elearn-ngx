# frozen_string_literal: true

class TagController < AuthenticatedController
  skip_before_action :authenticate_user!, only: %i[index show]
  skip_after_action :verify_authorized, only: :index
  before_action :set_tag, only: %i[show edit update destroy]

  def index
    root_tags = Tag.where(parent_id: nil).includes(:children, :questions)
    render json: root_tags.map { |tag| build_tag_tree(tag) }
  end

  def show
    authorize @tag
    render json: build_tag_tree(@tag)
  end

  def new
    @tag = Tag.new
    authorize @tag
  end

  def edit
    authorize @tag
  end

  def create
    @tag = Tag.new(tag_params(for_create: true))
    authorize @tag

    if @tag.save
      respond_to do |format|
        format.html { redirect_to tag_path(@tag), notice: t("messages.tag_created") }
        format.json { render json: { status: "success", tag: tag_payload(@tag) }, status: :created }
      end
    else
      respond_to do |format|
        format.html { redirect_to root_path, alert: @tag.errors.full_messages.to_sentence }
        format.json do
          render json: { status: "error", message: @tag.errors.full_messages.to_sentence },
                 status: :unprocessable_content
        end
      end
    end
  end

  def update
    authorize @tag

    if @tag.update(tag_params(for_create: false, current_tag: @tag))
      respond_to do |format|
        format.html { redirect_to tag_path(@tag) }
        format.json { render json: { status: "success", tag: tag_payload(@tag) }, status: :ok }
      end
    else
      respond_to do |format|
        format.html { redirect_to tag_path(@tag), alert: @tag.errors.full_messages.to_sentence }
        format.json do
          render json: { status: "error", message: @tag.errors.full_messages.to_sentence },
                 status: :unprocessable_content
        end
      end
    end
  end

  def destroy
    authorize @tag

    if @tag.destroy
      redirect_to root_path
    else
      redirect_to tag_path(@tag), alert: @tag.errors.full_messages.to_sentence
    end
  end

  private

  def set_tag
    @tag = Tag.find_by_param(params[:id])
    raise ActiveRecord::RecordNotFound, "Tag not found" unless @tag
  end

  def tag_params(for_create:, current_tag: nil)
    attributes = params.require(:tag).permit(:name, :color, :parent_id, :slug).to_h.symbolize_keys
    normalize_tag_attributes(attributes, for_create: for_create, current_tag: current_tag)
  end

  def normalize_tag_attributes(attributes, for_create:, current_tag: nil)
    if attributes[:slug].present?
      raw = attributes[:slug].to_s.strip.sub(/^tag-/, "")
      attributes[:slug] = "tag-#{raw.parameterize}"
    end
    attributes[:color] = attributes[:color].presence

    if for_create
      attributes[:color] ||= nil
    elsif attributes[:color].blank?
      attributes[:color] = current_tag&.color
    end

    attributes
  end

  def tag_payload(tag)
    {
      id: tag.id,
      uuid: tag.uuid,
      name: tag.name,
      slug: tag.slug,
      color: tag.color,
      permalink: tag_path(tag)
    }
  end

  def build_tag_tree(tag)
    {
      id: tag.id,
      uuid: tag.uuid,
      name: tag.name,
      slug: tag.slug,
      color: tag.color,
      permalink: tag_path(tag),
      type: "tag",
      questions: tag.questions.map { |q| serialize_question(q) },
      children: tag.children.map { |child| build_tag_tree(child) }
    }
  end

  def serialize_question(question)
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
      type: "question"
    }
  end
end
