# frozen_string_literal: true

FactoryBot.define do
  factory :question do
    sequence(:question_id_code) { |n| "Q-#{100 + n}" }
    config_data do
      {
        question: "What is 2 + 2?",
        choices: [
          { content: "3", correct: false },
          { content: "4", correct: true }
        ],
        hints: ["Count the numbers"],
        numChoices: 1,
        type: "multi-choice"
      }
    end
    slug { nil }
    uuid { nil }

    trait :with_xss do
      config_data do
        {
          question: "<script>alert('xss')</script>",
          choices: [
            { content: "<img src=x onerror=alert(1)>", correct: true },
            { content: "Safe choice", correct: false }
          ],
          hints: ["<script>alert('hint')</script>"],
          numChoices: 1,
          type: "multi-choice"
        }
      end
    end

    trait :with_malicious_payload do
      config_data do
        {
          question: "'; DROP TABLE questions; --",
          choices: [
            { content: "A", correct: true },
            { content: "B", correct: false }
          ],
          hints: ["Normal hint"],
          numChoices: 1,
          type: "multi-choice"
        }
      end
    end

    trait :empty_choices do
      config_data do
        {
          question: "Valid question text here",
          choices: [],
          numChoices: 1,
          type: "multi-choice"
        }
      end
    end

    trait :no_correct_choice do
      config_data do
        {
          question: "Valid question text here",
          choices: [
            { content: "A", correct: false },
            { content: "B", correct: false }
          ],
          numChoices: 1,
          type: "multi-choice"
        }
      end
    end

    trait :extremely_long do
      config_data do
        {
          question: "A" * 1_000_000,
          choices: [
            { content: "A", correct: true },
            { content: "B", correct: false }
          ],
          hints: ["Hint"],
          numChoices: 1,
          type: "multi-choice"
        }
      end
    end
  end
end
