FactoryBot.define do
  factory :assessment_session do
    association :user
    association :exercise
    score_percentage { 75.0 }
    duration_seconds { 300 }
    completed_at { 1.hour.ago }
    telemetry_data do
      {
        "session_metadata" => {
          "browser" => "Chrome",
          "platform" => "web"
        },
        "question_responses" => [
          {
            "question_uuid" => SecureRandom.uuid,
            "correct" => true,
            "choices_selected" => [1],
            "hints_used" => 0,
            "retry_count" => 0,
            "time_spent" => 30
          },
          {
            "question_uuid" => SecureRandom.uuid,
            "correct" => false,
            "choices_selected" => [0],
            "hints_used" => 1,
            "retry_count" => 1,
            "time_spent" => 60
          }
        ],
        "tag_registry" => {}
      }
    end

    trait :perfect_score do
      score_percentage { 100.0 }
      telemetry_data do
        {
          "session_metadata" => {},
          "question_responses" => [
            { "question_uuid" => SecureRandom.uuid, "correct" => true, "choices_selected" => [1], "hints_used" => 0,
              "retry_count" => 0, "time_spent" => 20 },
            { "question_uuid" => SecureRandom.uuid, "correct" => true, "choices_selected" => [0], "hints_used" => 0,
              "retry_count" => 0, "time_spent" => 25 }
          ],
          "tag_registry" => {}
        }
      end
    end

    trait :low_score do
      score_percentage { 25.0 }
      telemetry_data do
        {
          "session_metadata" => {},
          "question_responses" => [
            { "question_uuid" => SecureRandom.uuid, "correct" => false, "choices_selected" => [2], "hints_used" => 2,
              "retry_count" => 2, "time_spent" => 120 },
            { "question_uuid" => SecureRandom.uuid, "correct" => false, "choices_selected" => [1], "hints_used" => 1,
              "retry_count" => 1, "time_spent" => 90 },
            { "question_uuid" => SecureRandom.uuid, "correct" => true, "choices_selected" => [0], "hints_used" => 0,
              "retry_count" => 0, "time_spent" => 30 },
            { "question_uuid" => SecureRandom.uuid, "correct" => false, "choices_selected" => [3], "hints_used" => 2,
              "retry_count" => 2, "time_spent" => 150 }
          ],
          "tag_registry" => {}
        }
      end
    end

    trait :recent do
      completed_at { 1.day.ago }
    end

    trait :old do
      completed_at { 60.days.ago }
    end
  end
end
