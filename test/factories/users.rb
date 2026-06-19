# frozen_string_literal: true

FactoryBot.define do
  factory :user do
    email { Faker::Internet.unique.email }
    username { Faker::Internet.unique.username(specifier: 5..20, separators: %w[_]) }
    password { "password123" }
    password_confirmation { "password123" }

    trait :student do
      after(:create) do |user|
        user.roles.clear
        user.add_role(:student)
      end
    end

    trait :content_author do
      after(:create) do |user|
        user.roles.clear
        user.add_role(:content_author)
      end
    end

    trait :instructor do
      after(:create) do |user|
        user.roles.clear
        user.add_role(:instructor)
      end
    end

    trait :admin do
      after(:create) do |user|
        user.roles.clear
        user.add_role(:admin)
      end
    end
  end
end
