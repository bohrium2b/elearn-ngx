# frozen_string_literal: true

FactoryBot.define do
  factory :taxonomy_node do
    sequence(:name) { |n| "Taxonomy Node #{n}" }
    slug { nil }
    uuid { nil }
    level { :course }
    parent { nil }
    course { nil }
    position { 0 }

    trait :course do
      level { :course }
      sequence(:name) { |n| "Course #{n}" }
    end

    trait :part do
      level { :part }
      sequence(:name) { |n| "Part #{n}" }
      association :parent, factory: %i[taxonomy_node course]
    end

    trait :unit do
      level { :unit }
      sequence(:name) { |n| "Unit #{n}" }
      association :parent, factory: %i[taxonomy_node part]
    end

    trait :topic do
      level { :topic }
      sequence(:name) { |n| "Topic #{n}" }
      association :parent, factory: %i[taxonomy_node unit]
    end
  end
end
