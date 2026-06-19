# frozen_string_literal: true

FactoryBot.define do
  factory :topic_exercise do
    association :taxonomy_node, factory: %i[taxonomy_node topic]
    association :exercise
    position { 0 }
  end
end
