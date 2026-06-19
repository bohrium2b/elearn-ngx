# frozen_string_literal: true

FactoryBot.define do
  factory :role do
    name { "student" }
    resource_type { nil }
    resource_id { nil }
  end
end
