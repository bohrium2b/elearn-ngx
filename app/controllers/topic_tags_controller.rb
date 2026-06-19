# frozen_string_literal: true

class TopicTagsController < ApplicationController
  protect_from_forgery with: :null_session
  before_action :set_topic, only: %i[index create]
  before_action :set_topic_tag, only: [:destroy]

  # GET /topic_tags?taxonomy_node_id=:id
  def index
    @topic_tags = if @topic
                    @topic.topic_tags.includes(:tag)
                  else
                    TopicTag.includes(:taxonomy_node, :tag).all
                  end

    render json: @topic_tags.map { |tt| serialize_topic_tag(tt) }
  end

  # POST /topic_tags
  def create
    @topic_tag = @topic.topic_tags.build(topic_tag_params)

    if @topic_tag.save
      render json: serialize_topic_tag(@topic_tag), status: :created
    else
      render json: { errors: @topic_tag.errors.full_messages }, status: :unprocessable_content
    end
  end

  # DELETE /topic_tags/:id
  def destroy
    @topic_tag.destroy
    head :no_content
  end

  private

  def set_topic
    @topic = TaxonomyNode.find_by_param(params[:taxonomy_node_id]) if params[:taxonomy_node_id]
  end

  def set_topic_tag
    @topic_tag = TopicTag.find(params[:id])
  end

  def topic_tag_params
    params.require(:topic_tag).permit(:tag_id)
  end

  def serialize_topic_tag(topic_tag)
    {
      id: topic_tag.id,
      taxonomy_node_id: topic_tag.taxonomy_node_id,
      tag_id: topic_tag.tag_id,
      tag_name: topic_tag.tag.name,
      tag_color: topic_tag.tag.color,
      tag_slug: topic_tag.tag.slug,
      created_at: topic_tag.created_at
    }
  end
end
