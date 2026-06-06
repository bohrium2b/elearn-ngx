require "test_helper"

class Users::RegistrationsControllerTest < ActionDispatch::IntegrationTest
  test "should create user with default student role" do
    # Use unique identifiers to avoid conflicts
    unique_id = SecureRandom.hex(8)
    assert_difference("User.count") do
      post user_registration_path, params: {
        user: {
          email: "newuser_#{unique_id}@example.com",
          username: "newuser_#{unique_id}",
          password: "password123",
          password_confirmation: "password123"
        }
      }
    end

    user = User.find_by(email: "newuser_#{unique_id}@example.com")
    assert_not_nil user
    assert user.student?
    assert_not user.admin?
  end

  test "should ignore role parameter during registration" do
    unique_id = SecureRandom.hex(8)
    assert_difference("User.count") do
      post user_registration_path, params: {
        user: {
          email: "newuser_#{unique_id}@example.com",
          username: "newuser_#{unique_id}",
          password: "password123",
          password_confirmation: "password123",
          role: "admin"
        }
      }
    end

    user = User.find_by(email: "newuser_#{unique_id}@example.com")
    assert_not_nil user
    assert user.student?
    assert_not user.admin?
  end

  test "should ignore roles parameter during registration" do
    unique_id = SecureRandom.hex(8)
    assert_difference("User.count") do
      post user_registration_path, params: {
        user: {
          email: "newuser_#{unique_id}@example.com",
          username: "newuser_#{unique_id}",
          password: "password123",
          password_confirmation: "password123",
          roles: ["admin"]
        }
      }
    end

    user = User.find_by(email: "newuser_#{unique_id}@example.com")
    assert_not_nil user
    assert user.student?
    assert_not user.admin?
  end

  test "should require valid email" do
    assert_no_difference("User.count") do
      post user_registration_path, params: {
        user: {
          email: "invalid-email",
          username: "newuser4",
          password: "password123",
          password_confirmation: "password123"
        }
      }
    end
  end

  test "should require password confirmation" do
    assert_no_difference("User.count") do
      post user_registration_path, params: {
        user: {
          email: "newuser5@example.com",
          username: "newuser5",
          password: "password123",
          password_confirmation: "different"
        }
      }
    end
  end

  test "should require password minimum length" do
    assert_no_difference("User.count") do
      post user_registration_path, params: {
        user: {
          email: "newuser6@example.com",
          username: "newuser6",
          password: "short",
          password_confirmation: "short"
        }
      }
    end
  end
end
