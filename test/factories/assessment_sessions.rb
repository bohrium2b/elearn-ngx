# frozen_string_literal: true

FactoryBot.define do
  factory :assessment_session do
    association :user
    association :exercise
    taxonomy_node { nil }
    uuid { nil }
    score_percentage { 75.0 }
    completed_at { Time.current }
    duration_seconds { 120 }
    telemetry_data do
      {
        "question_responses" => [
          { "question_uuid" => SecureRandom.uuid, "correct" => true },
          { "question_uuid" => SecureRandom.uuid, "correct" => false }
        ],
        "tag_registry" => {},
        "session_metadata" => { "duration" => 120 }
      }
    end
  end
end
