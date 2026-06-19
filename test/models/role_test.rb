# frozen_string_literal: true

require "test_helper"

class RoleTest < ActiveSupport::TestCase
  # ============================================================================
  # Validations
  # ============================================================================

  test "should be valid with valid attributes" do
    role = build(:role)
    assert role.valid?
  end

  test "should require name" do
    role = build(:role, name: nil)
    assert_not role.valid?
    assert_includes role.errors[:name], "can't be blank"
  end

  test "should require unique name" do
    create(:role, name: "admin")
    role = build(:role, name: "admin")
    assert_not role.valid?
    assert_includes role.errors[:name], "has already been taken"
  end

  test "should require name to be in allowed roles" do
    role = build(:role, name: "invalid_role")
    assert_not role.valid?
    assert_includes role.errors[:name], "is not included in the list"
  end

  test "should accept student role" do
    role = build(:role, name: "student")
    assert role.valid?
  end

  test "should accept content_author role" do
    role = build(:role, name: "content_author")
    assert role.valid?
  end

  test "should accept instructor role" do
    role = build(:role, name: "instructor")
    assert role.valid?
  end

  test "should accept admin role" do
    role = build(:role, name: "admin")
    assert role.valid?
  end

  test "should allow nil resource_type" do
    role = build(:role, resource_type: nil)
    assert role.valid?
  end

  test "should validate resource_type inclusion when present" do
    role = build(:role, resource_type: "InvalidType")
    assert_not role.valid?
    assert_includes role.errors[:resource_type], "is not included in the list"
  end

  # ============================================================================
  # Associations
  # ============================================================================

  test "should have and belong to many users" do
    role = create(:role)
    user1 = create(:user)
    user2 = create(:user)

    user1.add_role(role.name)
    user2.add_role(role.name)

    assert_equal 2, role.users.count
  end

  test "should belong to resource polymorphically" do
    role = build(:role, resource_type: "TaxonomyNode", resource_id: 1)
    assert_equal "TaxonomyNode", role.resource_type
  end

  # ============================================================================
  # Constants
  # ============================================================================

  test "should define ROLES constant" do
    assert_equal %w[student content_author instructor admin], Role::ROLES
  end

  # ============================================================================
  # Scopify
  # ============================================================================

  test "should respond to scopify" do
    assert_respond_to Role, :scopify
  end
end
