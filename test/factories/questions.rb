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
  end
end
