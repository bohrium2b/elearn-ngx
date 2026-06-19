# frozen_string_literal: true

FactoryBot.define do
  factory :exercise do
    sequence(:title) { |n| "Exercise #{n}" }
    spec do
      {
        "selection_rules" => [
          {
            "type" => "static_question",
            "question_uuid" => SecureRandom.uuid
          }
        ]
      }
    end

    trait :with_dynamic_tag do
      transient do
        tag { nil }
        question_count { 2 }
      end

      spec do
        tag_uuid = tag&.uuid || create(:tag).uuid
        {
          "selection_rules" => [
            {
              "type" => "dynamic_tag",
              "tag_uuid" => tag_uuid,
              "count" => question_count,
              "strategy" => "random"
            }
          ]
        }
      end
    end
  end
end
