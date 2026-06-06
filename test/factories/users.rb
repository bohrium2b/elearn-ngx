FactoryBot.define do
  factory :user do
    email { Faker::Internet.unique.email }
    username { Faker::Internet.unique.username(specifier: 5..20, separators: %w[_]) }
    password { "password123" }
    password_confirmation { "password123" }

    trait :student do
      after(:create) { |user| user.add_role(:student) }
    end

    trait :content_author do
      after(:create) { |user| user.add_role(:content_author) }
    end

    trait :instructor do
      after(:create) { |user| user.add_role(:instructor) }
    end

    trait :admin do
      after(:create) { |user| user.add_role(:admin) }
    end
  end
end
