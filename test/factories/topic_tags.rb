# frozen_string_literal: true

FactoryBot.define do
  factory :topic_tag do
    association :taxonomy_node, factory: %i[taxonomy_node topic]
    association :tag
  end
end
