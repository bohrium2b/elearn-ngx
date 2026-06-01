FactoryBot.define do
  factory :tag do
    sequence(:name) { |n| "Math Topic #{n}" }
    parent { nil }
    uuid { nil }
    slug { nil }
    color { nil }

    trait :with_parent do
      association :parent, factory: :tag
    end
  end
end
