# frozen_string_literal: true

FactoryBot.define do
  factory :content_assignment do
    association :taxonomy_node, factory: %i[taxonomy_node topic]
    association :question
    position { 0 }
  end
end
