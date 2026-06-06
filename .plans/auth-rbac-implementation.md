# Authentication & RBAC Implementation Plan

## Executive Summary

This document outlines the implementation plan for adding authentication and role-based access control (RBAC) to the elearn-ngx platform. The solution uses **Devise** for authentication, **Pundit** for authorization, and **Rolify** for role management. Four roles are defined: `student`, `content_author`, `instructor`, and `admin`.

---

## 1. Package Installation & Configuration

### 1.1 Gemfile Updates

Add the following gems to [`Gemfile`](../Gemfile):

```ruby
# ── Authentication & Authorization ──────────────────────────────────────────
gem "devise", "~> 4.9"
gem "pundit", "~> 2.4"
gem "rolify", "~> 6.0"

# ── Session Security ────────────────────────────────────────────────────────
gem "redis", ">= 4.0.1"  # Uncomment for production session store
```

### 1.2 Install Gems

```bash
bundle install
rails generate devise:install
rails generate rolify:role
```

### 1.3 Devise Initializer

Create [`config/initializers/devise.rb`](../config/initializers/devise.rb):

```ruby
Devise.setup do |config|
  # ── Mailer ───────────────────────────────────────────────────────────────
  config.mailer_sender = ENV.fetch("MAILER_SENDER", "noreply@elearn-ngx.com")

  # ── ORM ──────────────────────────────────────────────────────────────────
  require "devise/orm/active_record"

  # ── Authentication ───────────────────────────────────────────────────────
  config.case_insensitive_keys = [:email]
  config.strip_whitespace_keys = [:email]
  config.skip_session_storage = [:http_auth]

  # ── Password ─────────────────────────────────────────────────────────────
  config.stretches = Rails.env.test? ? 1 : 12
  config.pepper = ENV.fetch("DEVISE_PEPPER", nil)

  # ── Confirmation ─────────────────────────────────────────────────────────
  config.reconfirmable = true
  config.confirm_within = 3.days

  # ── Remember Me ──────────────────────────────────────────────────────────
  config.remember_for = 2.weeks
  config.expire_all_remember_me_on_sign_out = true

  # ── Password Length ──────────────────────────────────────────────────────
  config.password_length = 8..128

  # ── Email Regex ──────────────────────────────────────────────────────────
  config.email_regexp = /\A[^@\s]+@[^@\s]+\z/

  # ── Lockable ─────────────────────────────────────────────────────────────
  config.lock_strategy = :failed_attempts
  config.unlock_keys = [:email]
  config.unlock_strategy = :both
  config.maximum_attempts = 5
  config.unlock_in = 1.hour

  # ── Timeout ──────────────────────────────────────────────────────────────
  config.timeout_in = 30.minutes

  # ── Sign Out ─────────────────────────────────────────────────────────────
  config.sign_out_via = :delete

  # ── Navigation ───────────────────────────────────────────────────────────
  config.navigational_formats = ["*/*", :html, :turbo_stream]
end
```

### 1.4 Pundit Initializer

Create [`config/initializers/pundit.rb`](../config/initializers/pundit.rb):

```ruby
# Pundit configuration for strict authorization enforcement
Pundit.configure do |config|
  config.pundit_user_method = :current_user
end
```

### 1.5 Session Store Configuration

Update [`config/initializers/session_store.rb`](../config/initializers/session_store.rb):

```ruby
# ── Session Store Configuration ──────────────────────────────────────────────
# Uses encrypted cookies with secure flags for production.

Rails.application.config.session_store :cookie_store,
  key: "_elearn_session",
  secure: Rails.env.production?,
  same_site: Rails.env.production? ? :strict : :lax,
  httponly: true,
  expire_after: 30.minutes

# Production: Use Redis for session storage (recommended for multi-server setups)
# Rails.application.config.session_store :redis_store,
#   servers: [ENV.fetch("REDIS_URL", "redis://localhost:6379/0/session")],
#   expire_after: 30.minutes,
#   key: "_elearn_session",
#   secure: true,
#   same_site: :strict,
#   httponly: true
```

### 1.6 Content Security Policy

Update [`config/initializers/content_security_policy.rb`](../config/initializers/content_security_policy.rb):

```ruby
Rails.application.configure do
  config.content_security_policy do |policy|
    policy.default_src :self
    policy.font_src    :self, :data
    policy.img_src     :self, :data, :blob
    policy.object_src  :none
    policy.script_src  :self
    policy.style_src   :self, :unsafe_inline
    policy.connect_src :self
    policy.frame_ancestors :none
    policy.base_uri    :self
    policy.form_action :self
  end

  config.content_security_policy_nonce_generator = ->(request) { request.session.id.to_s }
  config.content_security_policy_nonce_directives = %w(script-src style-src)
end
```

---

## 2. Data Model & Role Architecture

### 2.1 User Model Migration

```ruby
# db/migrate/XXXXXX_devise_create_users.rb
class DeviseCreateUsers < ActiveRecord::Migration[7.2]
  def change
    create_table :users, id: :uuid do |t|
      ## Database authenticatable
      t.string :email,              null: false, default: ""
      t.string :encrypted_password, null: false, default: ""

      ## Recoverable
      t.string   :reset_password_token
      t.datetime :reset_password_sent_at

      ## Rememberable
      t.datetime :remember_created_at

      ## Trackable
      t.integer  :sign_in_count, default: 0, null: false
      t.datetime :current_sign_in_at
      t.datetime :last_sign_in_at
      t.string   :current_sign_in_ip
      t.string   :last_sign_in_ip

      ## Confirmable
      t.string   :confirmation_token
      t.datetime :confirmed_at
      t.datetime :confirmation_sent_at
      t.string   :unconfirmed_email

      ## Lockable
      t.integer  :failed_attempts, default: 0, null: false
      t.string   :unlock_token
      t.datetime :locked_at

      ## Profile
      t.string :display_name
      t.text   :bio

      t.timestamps null: false
    end

    add_index :users, :email,                unique: true
    add_index :users, :reset_password_token, unique: true
    add_index :users, :confirmation_token,   unique: true
    add_index :users, :unlock_token,         unique: true
  end
end
```

### 2.2 Role Model (Rolify)

```ruby
# db/migrate/XXXXXX_rolify_create_roles.rb
class RolifyCreateRoles < ActiveRecord::Migration[7.2]
  def change
    create_table(:roles, id: :uuid) do |t|
      t.string :name
      t.references :resource, polymorphic: true, type: :uuid

      t.timestamps
    end

    create_table(:users_roles, id: false) do |t|
      t.references :user, type: :uuid, foreign_key: true
      t.references :role, type: :uuid, foreign_key: true
    end

    add_index(:roles, :name)
    add_index(:roles, [:name, :resource_type, :resource_id])
    add_index(:users_roles, [:user_id, :role_id])
  end
end
```

### 2.3 User Model

```ruby
# app/models/user.rb
class User < ApplicationRecord
  rolify

  # ── Devise Modules ───────────────────────────────────────────────────────
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable,
         :confirmable, :lockable, :timeoutable, :trackable

  # ── Validations ──────────────────────────────────────────────────────────
  validates :email, presence: true, uniqueness: { case_sensitive: false }
  validates :display_name, length: { maximum: 100 }, allow_blank: true

  # ── Callbacks ─────────────────────────────────────────────────────────────
  after_create :assign_default_role

  # ── Role Query Methods ────────────────────────────────────────────────────
  def student?       = has_role?(:student)
  def content_author? = has_role?(:content_author)
  def instructor?    = has_role?(:instructor)
  def admin?         = has_role?(:admin)

  def any_role?(*roles)
    roles.any? { |role| has_role?(role) }
  end

  private

  def assign_default_role
    add_role(:student) if roles.blank?
  end
end
```

### 2.4 Role Model

```ruby
# app/models/role.rb
class Role < ApplicationRecord
  has_and_belongs_to_many :users, join_table: :users_roles

  belongs_to :resource,
             polymorphic: true,
             optional: true

  validates :resource_type,
            inclusion: { in: Rolify.resource_types },
            allow_nil: true

  scopify

  # ── Valid Roles ───────────────────────────────────────────────────────────
  VALID_ROLES = %w[student content_author instructor admin].freeze

  validates :name, inclusion: { in: VALID_ROLES }
end
```

### 2.5 Role Hierarchy & Permissions

| Role | Permissions |
|------|-------------|
| `student` | View questions, exercises, tags; Start exercises |
| `content_author` | All student permissions + Create/Edit/Delete questions and tags |
| `instructor` | All content_author permissions + Create/Edit/Delete exercises |
| `admin` | All permissions + Manage users and roles |

### 2.6 Seed Data

```ruby
# db/seeds.rb
# Create default roles
%w[student content_author instructor admin].each do |role_name|
  Role.find_or_create_by(name: role_name)
end

# Create admin user (change password in production!)
admin = User.find_or_create_by(email: "admin@elearn-ngx.com") do |user|
  user.password = "ChangeMe123!"
  user.password_confirmation = "ChangeMe123!"
  user.display_name = "System Administrator"
  user.skip_confirmation!
end
admin.add_role(:admin)

puts "Seeded #{Role.count} roles and #{User.count} users"
```

---

## 3. Authorization Policies (Pundit)

### 3.1 Application Policy

```ruby
# app/policies/application_policy.rb
class ApplicationPolicy
  attr_reader :user, :record

  def initialize(user, record)
    raise Pundit::NotAuthorizedError, "must be logged in" unless user

    @user = user
    @record = record
  end

  def index?
    false
  end

  def show?
    false
  end

  def create?
    false
  end

  def new?
    create?
  end

  def update?
    false
  end

  def edit?
    update?
  end

  def destroy?
    false
  end

  class Scope
    attr_reader :user, :scope

    def initialize(user, scope)
      raise Pundit::NotAuthorizedError, "must be logged in" unless user

      @user = user
      @scope = scope
    end

    def resolve
      scope.none
    end
  end
end
```

### 3.2 Question Policy

```ruby
# app/policies/question_policy.rb
class QuestionPolicy < ApplicationPolicy
  # ── Authorization Matrix ─────────────────────────────────────────────────
  # | Action    | Student | Content Author | Instructor | Admin |
  # |-----------|---------|----------------|------------|-------|
  # | index     | ✅      | ✅             | ✅         | ✅    |
  # | show      | ✅      | ✅             | ✅         | ✅    |
  # | create    | ❌      | ✅             | ✅         | ✅    |
  # | update    | ❌      | ✅             | ✅         | ✅    |
  # | destroy   | ❌      | ✅             | ✅         | ✅    |

  def index?
    true # All authenticated users
  end

  def show?
    true # All authenticated users
  end

  def create?
    user.content_author? || user.instructor? || user.admin?
  end

  def update?
    user.content_author? || user.instructor? || user.admin?
  end

  def destroy?
    user.content_author? || user.instructor? || user.admin?
  end

  class Scope < Scope
    def resolve
      scope.all # All authenticated users can see all questions
    end
  end
end
```

### 3.3 Exercise Policy

```ruby
# app/policies/exercise_policy.rb
class ExercisePolicy < ApplicationPolicy
  # ── Authorization Matrix ─────────────────────────────────────────────────
  # | Action    | Student | Content Author | Instructor | Admin |
  # |-----------|---------|----------------|------------|-------|
  # | index     | ✅      | ✅             | ✅         | ✅    |
  # | show      | ✅      | ✅             | ✅         | ✅    |
  # | start     | ✅      | ✅             | ✅         | ✅    |
  # | create    | ❌      | ❌             | ✅         | ✅    |
  # | update    | ❌      | ❌             | ✅         | ✅    |
  # | destroy   | ❌      | ❌             | ✅         | ✅    |

  def index?
    true
  end

  def show?
    true
  end

  def start?
    true
  end

  def create?
    user.instructor? || user.admin?
  end

  def update?
    user.instructor? || user.admin?
  end

  def destroy?
    user.instructor? || user.admin?
  end

  class Scope < Scope
    def resolve
      scope.all
    end
  end
end
```

### 3.4 Tag Policy

```ruby
# app/policies/tag_policy.rb
class TagPolicy < ApplicationPolicy
  # ── Authorization Matrix ─────────────────────────────────────────────────
  # | Action    | Student | Content Author | Instructor | Admin |
  # |-----------|---------|----------------|------------|-------|
  # | index     | ✅      | ✅             | ✅         | ✅    |
  # | show      | ✅      | ✅             | ✅         | ✅    |
  # | create    | ❌      | ✅             | ✅         | ✅    |
  # | update    | ❌      | ✅             | ✅         | ✅    |
  # | destroy   | ❌      | ✅             | ✅         | ✅    |

  def index?
    true
  end

  def show?
    true
  end

  def create?
    user.content_author? || user.instructor? || user.admin?
  end

  def update?
    user.content_author? || user.instructor? || user.admin?
  end

  def destroy?
    user.content_author? || user.instructor? || user.admin?
  end

  class Scope < Scope
    def resolve
      scope.all
    end
  end
end
```

### 3.5 Workspace Policy

```ruby
# app/policies/workspace_policy.rb
class WorkspacePolicy < ApplicationPolicy
  # ── Authorization Matrix ─────────────────────────────────────────────────
  # | Action    | Student | Content Author | Instructor | Admin |
  # |-----------|---------|----------------|------------|-------|
  # | show      | ✅      | ✅             | ✅         | ✅    |

  def show?
    true
  end

  class Scope < Scope
    def resolve
      scope.all
    end
  end
end
```

### 3.6 User Policy (Admin Only)

```ruby
# app/policies/user_policy.rb
class UserPolicy < ApplicationPolicy
  # ── Authorization Matrix ─────────────────────────────────────────────────
  # | Action    | Student | Content Author | Instructor | Admin |
  # |-----------|---------|----------------|------------|-------|
  # | index     | ❌      | ❌             | ❌         | ✅    |
  # | show      | ❌      | ❌             | ❌         | ✅    |
  # | create    | ❌      | ❌             | ❌         | ✅    |
  # | update    | ❌      | ❌             | ❌         | ✅    |
  # | destroy   | ❌      | ❌             | ❌         | ✅    |
  # | manage_roles | ❌   | ❌             | ❌         | ✅    |

  def index?
    user.admin?
  end

  def show?
    user.admin?
  end

  def create?
    user.admin?
  end

  def update?
    user.admin?
  end

  def destroy?
    user.admin? && user != record # Prevent self-deletion
  end

  def manage_roles?
    user.admin?
  end

  class Scope < Scope
    def resolve
      user.admin? ? scope.all : scope.none
    end
  end
end
```

---

## 4. Authentication Views & Layouts

### 4.1 Generate Devise Views

```bash
rails generate devise:views users
```

### 4.2 Auth Layout

Create [`app/views/layouts/auth.html.erb`](../app/views/layouts/auth.html.erb):

```erb
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title><%= content_for?(:title) ? yield(:title) : "ElearnNgx" %></title>
    <%= csrf_meta_tags %>
    <%= csp_meta_tag %>
    <%= vite_client_tag %>
    <%= vite_javascript_tag "application.ts", defer: true %>
    <%= stylesheet_link_tag "application", "data-turbo-track": "reload" %>
  </head>
  <body class="auth-layout">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-md-6 col-lg-5">
          <div class="card shadow-sm mt-5">
            <div class="card-body p-4">
              <% if notice %>
                <div class="alert alert-success alert-dismissible fade show" role="alert">
                  <%= notice %>
                  <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
              <% end %>
              <% if alert %>
                <div class="alert alert-danger alert-dismissible fade show" role="alert">
                  <%= alert %>
                  <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
              <% end %>
              <%= yield %>
            </div>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>
```

### 4.3 Sign In View

Update [`app/views/users/sessions/new.html.erb`](../app/views/users/sessions/new.html.erb):

```erb
<% content_for :title, "Sign In" %>
<% content_for :body_class, "auth-layout" %>

<h2 class="text-center mb-4">Sign In</h2>

<%= form_for(resource, as: resource_name, url: session_path(resource_name), html: { class: "needs-validation" }) do |f| %>
  <div class="mb-3">
    <%= f.label :email, class: "form-label" %>
    <%= f.email_field :email, autofocus: true, autocomplete: "email", class: "form-control", required: true %>
  </div>

  <div class="mb-3">
    <%= f.label :password, class: "form-label" %>
    <%= f.password_field :password, autocomplete: "current-password", class: "form-control", required: true %>
  </div>

  <% if devise_mapping.rememberable? %>
    <div class="mb-3 form-check">
      <%= f.check_box :remember_me, class: "form-check-input" %>
      <%= f.label :remember_me, class: "form-check-label" %>
    </div>
  <% end %>

  <div class="d-grid">
    <%= f.submit "Sign In", class: "btn btn-primary" %>
  </div>
<% end %>

<div class="mt-3 text-center">
  <%= render "users/shared/links" %>
</div>
```

### 4.4 Registration View

Update [`app/views/users/registrations/new.html.erb`](../app/views/users/registrations/new.html.erb):

```erb
<% content_for :title, "Create Account" %>
<% content_for :body_class, "auth-layout" %>

<h2 class="text-center mb-4">Create Account</h2>

<%= form_for(resource, as: resource_name, url: registration_path(resource_name), html: { class: "needs-validation" }) do |f| %>
  <%= render "users/shared/error_messages", resource: resource %>

  <div class="mb-3">
    <%= f.label :email, class: "form-label" %>
    <%= f.email_field :email, autofocus: true, autocomplete: "email", class: "form-control", required: true %>
  </div>

  <div class="mb-3">
    <%= f.label :display_name, class: "form-label" %>
    <%= f.text_field :display_name, class: "form-control" %>
  </div>

  <div class="mb-3">
    <%= f.label :password, class: "form-label" %>
    <% if @minimum_password_length %>
      <small class="text-muted">(<%= @minimum_password_length %> characters minimum)</small>
    <% end %>
    <%= f.password_field :password, autocomplete: "new-password", class: "form-control", required: true %>
  </div>

  <div class="mb-3">
    <%= f.label :password_confirmation, class: "form-label" %>
    <%= f.password_field :password_confirmation, autocomplete: "new-password", class: "form-control", required: true %>
  </div>

  <div class="d-grid">
    <%= f.submit "Create Account", class: "btn btn-primary" %>
  </div>
<% end %>

<div class="mt-3 text-center">
  <%= render "users/shared/links" %>
</div>
```

### 4.5 Parameter Sanitization

Update [`app/controllers/application_controller.rb`](../app/controllers/application_controller.rb):

```ruby
class ApplicationController < ActionController::Base
  include Pundit::Authorization

  # ── Authentication ────────────────────────────────────────────────────────
  before_action :authenticate_user!

  # ── Parameter Sanitization ────────────────────────────────────────────────
  before_action :configure_permitted_parameters, if: :devise_controller?

  # ── Authorization Error Handling ─────────────────────────────────────────
  rescue_from Pundit::NotAuthorizedError, with: :user_not_authorized

  # ── Browser Support ──────────────────────────────────────────────────────
  allow_browser versions: :modern

  protected

  def configure_permitted_parameters
    # Explicitly permit only safe fields - NO role assignment via forms
    devise_parameter_sanitizer.permit(:sign_up, keys: [:email, :display_name, :password, :password_confirmation])
    devise_parameter_sanitizer.permit(:account_update, keys: [:email, :display_name, :password, :password_confirmation, :current_password])
  end

  private

  def user_not_authorized
    flash[:alert] = "You are not authorized to perform this action."
    redirect_back(fallback_location: root_path)
  end
end
```

---

## 5. Global Navigation Island Component

### 5.1 Navigation Island Component

Create [`app/frontend/components/islands/global-nav.tsx`](../app/frontend/components/islands/global-nav.tsx):

```tsx
import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Chip,
} from "@mui/material";
import { AccountCircle } from "@mui/icons-material";

// ── Types ────────────────────────────────────────────────────────────────────
interface UserMetadata {
  id: string;
  email: string;
  displayName: string;
  roles: string[];
}

interface NavItem {
  label: string;
  href: string;
  requiredRole?: string[];
}

interface GlobalNavProps {
  user: UserMetadata | null;
  signOutPath: string;
  signInPath: string;
  registrationPath: string;
}

// ── Navigation Configuration ─────────────────────────────────────────────────
const NAV_ITEMS: NavItem[] = [
  { label: "Workspace", href: "/" },
  { label: "Questions", href: "/questions" },
  { label: "Exercises", href: "/exercises" },
  { label: "Tags", href: "/tag" },
];

const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: "Users", href: "/admin/users", requiredRole: ["admin"] },
];

// ── Component ────────────────────────────────────────────────────────────────
export const tagName = "global-nav";

export default function GlobalNav({
  user,
  signOutPath,
  signInPath,
  registrationPath,
}: GlobalNavProps) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const hasRole = (requiredRoles?: string[]): boolean => {
    if (!requiredRoles || requiredRoles.length === 0) return true;
    if (!user?.roles) return false;
    return requiredRoles.some((role) => user.roles.includes(role));
  };

  const allNavItems = [...NAV_ITEMS, ...ADMIN_NAV_ITEMS];
  const visibleNavItems = allNavItems.filter((item) => hasRole(item.requiredRole));

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar>
        {/* Logo / Brand */}
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          <a href="/" style={{ textDecoration: "none", color: "inherit" }}>
            elearn-ngx
          </a>
        </Typography>

        {/* Navigation Items */}
        <Box sx={{ display: "flex", gap: 1, mr: 2 }}>
          {visibleNavItems.map((item) => (
            <Button key={item.href} href={item.href} color="inherit">
              {item.label}
            </Button>
          ))}
        </Box>

        {/* User Menu or Auth Buttons */}
        {user ? (
          <>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mr: 1 }}>
              <Chip
                label={user.roles[0] || "user"}
                size="small"
                color="primary"
                variant="outlined"
              />
            </Box>
            <IconButton onClick={handleMenuOpen} color="inherit">
              <Avatar sx={{ width: 32, height: 32 }}>
                {user.displayName?.charAt(0) || user.email.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem disabled>
                <Typography variant="body2" color="text.secondary">
                  {user.displayName || user.email}
                </Typography>
              </MenuItem>
              <MenuItem onClick={handleMenuClose} href="/users/edit">
                Profile
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handleMenuClose();
                  const form = document.createElement("form");
                  form.method = "POST";
                  form.action = signOutPath;
                  const csrfToken = document.querySelector(
                    'meta[name="csrf-token"]'
                  )?.getAttribute("content");
                  if (csrfToken) {
                    const csrfInput = document.createElement("input");
                    csrfInput.type = "hidden";
                    csrfInput.name = "authenticity_token";
                    csrfInput.value = csrfToken;
                    form.appendChild(csrfInput);
                  }
                  const methodInput = document.createElement("input");
                  methodInput.type = "hidden";
                  methodInput.name = "_method";
                  methodInput.value = "delete";
                  form.appendChild(methodInput);
                  document.body.appendChild(form);
                  form.submit();
                }}
              >
                Sign Out
              </MenuItem>
            </Menu>
          </>
        ) : (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button href={signInPath} color="inherit">
              Sign In
            </Button>
            <Button href={registrationPath} variant="contained" color="primary">
              Register
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}
```

### 5.2 Rails Helper for User Metadata

Create [`app/helpers/navigation_helper.rb`](../app/helpers/navigation_helper.rb):

```ruby
module NavigationHelper
  def current_user_metadata
    return nil unless user_signed_in?

    {
      id: current_user.id,
      email: current_user.email,
      displayName: current_user.display_name,
      roles: current_user.roles.pluck(:name)
    }
  end

  def user_metadata_json
    current_user_metadata&.to_json || "null"
  end
end
```

### 5.3 Update Application Layout

Update [`app/views/layouts/application.html.erb`](../app/views/layouts/application.html.erb):

```erb
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="turbo-cache-control" content="no-preview">
    <meta name="csrf-token" content="<%= form_authenticity_token %>">

    <title><%= content_for?(:title) ? yield(:title) : "ElearnNgx" %></title>
    <meta name="description" content="<%= content_for?(:description) ? yield(:description) : "elearn-ngx" %>">

    <%= vite_client_tag %>
    <%= vite_javascript_tag "application.ts", defer: true %>
    <%= vite_javascript_tag "web_components.ts", defer: true %>
    <%= vite_stylesheet_tag "application", media: "all" if ViteRails.instance.manifest.path_for("application.css") rescue nil %>
    <%= stylesheet_link_tag "application", "data-turbo-track": "reload" %>
    <%= yield :head %>
  </head>

  <body class="<%= content_for?(:body_class) ? yield(:body_class) : "" %>">
    <%# Global Navigation Island %>
    <global-nav
      data-props="<%= user_metadata_json %>"
      data-sign-out-path="<%= destroy_user_session_path %>"
      data-sign-in-path="<%= new_user_session_path %>"
      data-registration-path="<%= new_user_registration_path %>">
    </global-nav>

    <%# Flash messages %>
    <% flash.each do |type, message| %>
      <div class="alert alert-<%= type == 'notice' ? 'success' : 'warning' %>" role="alert">
        <%= message %>
      </div>
    <% end %>

    <%= yield %>
  </body>
</html>
```

---

## 6. Controller Authorization Guards

### 6.1 Application Controller

```ruby
# app/controllers/application_controller.rb
class ApplicationController < ActionController::Base
  include Pundit::Authorization

  # ── Authentication ────────────────────────────────────────────────────────
  before_action :authenticate_user!

  # ── Parameter Sanitization ────────────────────────────────────────────────
  before_action :configure_permitted_parameters, if: :devise_controller?

  # ── Authorization Error Handling ─────────────────────────────────────────
  rescue_from Pundit::NotAuthorizedError, with: :user_not_authorized

  # ── Browser Support ──────────────────────────────────────────────────────
  allow_browser versions: :modern

  protected

  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:sign_up, keys: [:email, :display_name, :password, :password_confirmation])
    devise_parameter_sanitizer.permit(:account_update, keys: [:email, :display_name, :password, :password_confirmation, :current_password])
  end

  private

  def user_not_authorized
    respond_to do |format|
      format.html do
        flash[:alert] = "You are not authorized to perform this action."
        redirect_back(fallback_location: root_path)
      end
      format.json do
        render json: { error: "Forbidden", message: "You are not authorized to perform this action." }, status: :forbidden
      end
    end
  end
end
```

### 6.2 Questions Controller

```ruby
# app/controllers/questions_controller.rb
class QuestionsController < ApplicationController
  # Skip authentication for index/show if you want public access
  # skip_before_action :authenticate_user!, only: [:index, :show]

  def index
    @questions = policy_scope(Question)
    render json: @questions.map { |question| serialize_question(question) }
  end

  def show
    @question = find_question_by_param(params[:id])
    authorize @question
    render json: serialize_question(@question)
  end

  def new
    @question = Question.new
    authorize @question
    # ... rest of new action
  end

  def edit
    @question = find_question_by_param(params[:id])
    authorize @question
    # ... rest of edit action
  end

  def create
    @question = Question.new
    authorize @question
    # ... rest of create action
  end

  def update
    @question = find_question_by_param(params[:id])
    authorize @question
    # ... rest of update action
  end

  def destroy
    @question = find_question_by_param(params[:id])
    authorize @question
    # ... rest of destroy action
  end

  private

  # ... existing private methods
end
```

### 6.3 Exercises Controller

```ruby
# app/controllers/exercises_controller.rb
class ExercisesController < ApplicationController
  def index
    @exercises = policy_scope(Exercise)
    respond_to do |format|
      format.html
      format.json { render json: @exercises }
    end
  end

  def show
    @exercise = Exercise.find(params[:id])
    authorize @exercise
    respond_to do |format|
      format.html
      format.json { render json: @exercise }
    end
  end

  def new
    @exercise = Exercise.new
    authorize @exercise
    @tags = Tag.all
    @questions = Question.all
  end

  def edit
    @exercise = Exercise.find(params[:id])
    authorize @exercise
    @tags = Tag.all
    @questions = Question.all
  end

  def create
    @exercise = Exercise.new(exercise_params)
    authorize @exercise

    if @exercise.save
      render json: @exercise, status: :created, location: @exercise
    else
      render json: @exercise.errors, status: :unprocessable_content
    end
  end

  def update
    @exercise = Exercise.find(params[:id])
    authorize @exercise

    if @exercise.update(exercise_params)
      render json: @exercise
    else
      render json: @exercise.errors, status: :unprocessable_content
    end
  end

  def start
    @exercise = Exercise.find(params[:id])
    authorize @exercise
    @resolved_questions = ExerciseResolver.new(@exercise.spec).resolve

    respond_to do |format|
      format.html
      format.json { render json: { title: @exercise.title, questions: @resolved_questions } }
    end
  end

  def destroy
    @exercise = Exercise.find(params[:id])
    authorize @exercise

    if @exercise.destroy
      redirect_to exercises_url, notice: "Exercise was successfully deleted."
    else
      redirect_to exercises_url, alert: @exercise.errors.full_messages.to_sentence
    end
  end

  private

  def exercise_params
    params.require(:exercise).permit(:title, spec: [{ selection_rules: %i[type tag_uuid count strategy question_uuid] }])
  end
end
```

### 6.4 Tag Controller

```ruby
# app/controllers/tag_controller.rb
class TagController < ApplicationController
  def index
    @tags = policy_scope(Tag)
    root_tags = @tags.where(parent_id: nil).includes(:children, :questions)
    render json: root_tags.map { |tag| build_tag_tree(tag) }
  end

  def show
    @tag = find_tag_by_param(params[:id])
    authorize @tag
    render json: build_tag_tree(@tag)
  end

  def create
    @tag = Tag.new(tag_params(for_create: true))
    authorize @tag

    if @tag.save
      respond_to do |format|
        format.html { redirect_to tag_path(@tag), notice: "Tag was created." }
        format.json { render json: { status: "success", tag: tag_payload(@tag) }, status: :created }
      end
    else
      respond_to do |format|
        format.html { redirect_to root_path, alert: @tag.errors.full_messages.to_sentence }
        format.json { render json: { status: "error", message: @tag.errors.full_messages.to_sentence }, status: :unprocessable_content }
      end
    end
  end

  def update
    @tag = find_tag_by_param(params[:id])
    authorize @tag

    if @tag.update(tag_params(for_create: false, current_tag: @tag))
      respond_to do |format|
        format.html { redirect_to tag_path(@tag) }
        format.json { render json: { status: "success", tag: tag_payload(@tag) }, status: :ok }
      end
    else
      respond_to do |format|
        format.html { redirect_to tag_path(@tag), alert: @tag.errors.full_messages.to_sentence }
        format.json { render json: { status: "error", message: @tag.errors.full_messages.to_sentence }, status: :unprocessable_content }
      end
    end
  end

  def destroy
    @tag = find_tag_by_param(params[:id])
    authorize @tag

    if @tag.destroy
      redirect_to root_path
    else
      redirect_to tag_path(@tag), alert: @tag.errors.full_messages.to_sentence
    end
  end

  private

  # ... existing private methods
end
```

### 6.5 Workspace Controller

```ruby
# app/controllers/workspace_controller.rb
class WorkspaceController < ApplicationController
  def show
    authorize :workspace, :show?
    @untagged_questions = Question.untagged
    @tree_data = Tag.where(parent_id: nil).map { |root_tag| assemble_tree_node(root_tag) }

    respond_to do |format|
      format.html
      format.json { render json: build_workspace_payload }
    end
  end

  private

  # ... existing private methods
end
```

### 6.6 Users Controller (Admin)

```ruby
# app/controllers/users_controller.rb
class UsersController < ApplicationController
  before_action :set_user, only: [:show, :edit, :update, :destroy]

  def index
    @users = policy_scope(User)
    authorize User
  end

  def show
    authorize @user
  end

  def edit
    authorize @user
  end

  def update
    authorize @user

    # Handle role updates separately
    if params[:user][:roles].present?
      update_user_roles(@user, params[:user][:roles])
    end

    if @user.update(user_params)
      redirect_to @user, notice: "User was successfully updated."
    else
      render :edit, status: :unprocessable_content
    end
  end

  def destroy
    authorize @user

    if @user.destroy
      redirect_to users_url, notice: "User was successfully deleted."
    else
      redirect_to users_url, alert: @user.errors.full_messages.to_sentence
    end
  end

  private

  def set_user
    @user = User.find(params[:id])
  end

  def user_params
    params.require(:user).permit(:email, :display_name, :bio)
  end

  def update_user_roles(user, new_roles)
    return unless current_user.admin?

    # Validate roles
    valid_roles = Role::VALID_ROLES
    new_roles = new_roles.select { |role| valid_roles.include?(role) }

    # Clear existing roles and assign new ones
    user.roles.clear
    new_roles.each { |role| user.add_role(role) }
  end
end
```

---

## 7. Performance Optimizations

### 7.1 Database Indexes

```ruby
# db/migrate/XXXXXX_add_performance_indexes.rb
class AddPerformanceIndexes < ActiveRecord::Migration[7.2]
  def change
    # Users table indexes
    add_index :users, :email, unique: true, name: "index_users_on_email"
    add_index :users, :reset_password_token, unique: true, name: "index_users_on_reset_password_token"
    add_index :users, :confirmation_token, unique: true, name: "index_users_on_confirmation_token"

    # Roles table indexes
    add_index :roles, :name, name: "index_roles_on_name"
    add_index :roles, [:name, :resource_type, :resource_id], name: "index_roles_on_name_and_resource"

    # Users roles join table
    add_index :users_roles, [:user_id, :role_id], unique: true, name: "index_users_roles_on_user_id_and_role_id"
  end
end
```

### 7.2 N+1 Query Prevention

```ruby
# app/controllers/application_controller.rb
class ApplicationController < ActionController::Base
  # ... existing code

  private

  # Eager load user roles to prevent N+1 queries
  def current_user_with_roles
    return nil unless user_signed_in?
    User.includes(:roles).find(current_user.id)
  end
end
```

### 7.3 Secure Cookie Configuration

```ruby
# config/initializers/session_store.rb
Rails.application.config.session_store :cookie_store,
  key: "_elearn_session",
  secure: Rails.env.production?,
  same_site: Rails.env.production? ? :strict : :lax,
  httponly: true,
  expire_after: 30.minutes
```

### 7.4 Fragment Cache Isolation

```erb
<%# app/views/layouts/application.html.erb %>
<%# Cache user-specific fragments separately %>
<% if user_signed_in? %>
  <% cache ["user-nav", current_user.id, current_user.roles.maximum(:updated_at)] do %>
    <global-nav data-props="<%= user_metadata_json %>" ...></global-nav>
  <% end %>
<% else %>
  <% cache "guest-nav" do %>
    <global-nav data-props="null" ...></global-nav>
  <% end %>
<% end %>
```

---

## 8. Testing Requirements

### 8.1 Backend Tests (Minitest)

#### 8.1.1 Registration Guards Test

```ruby
# test/controllers/users/registrations_controller_test.rb
require "test_helper"

class Users::RegistrationsControllerTest < ActionDispatch::IntegrationTest
  test "should allow new user registration" do
    assert_difference("User.count") do
      post user_registration_path, params: {
        user: {
          email: "newuser@example.com",
          password: "Password123!",
          password_confirmation: "Password123!"
        }
      }
    end
    assert_redirected_to root_path
  end

  test "should prevent role assignment during registration" do
    assert_no_difference("Role.count") do
      post user_registration_path, params: {
        user: {
          email: "newuser@example.com",
          password: "Password123!",
          password_confirmation: "Password123!",
          roles: ["admin"]  # This should be ignored
        }
      }
    end

    user = User.find_by(email: "newuser@example.com")
    assert user.student?
    assert_not user.admin?
  end

  test "should require minimum password length" do
    assert_no_difference("User.count") do
      post user_registration_path, params: {
        user: {
          email: "newuser@example.com",
          password: "short",
          password_confirmation: "short"
        }
      }
    end
    assert_response :unprocessable_content
  end
end
```

#### 8.1.2 Controller Rejection Test

```ruby
# test/controllers/questions_controller_test.rb
require "test_helper"

class QuestionsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @student = users(:student)
    @content_author = users(:content_author)
    @instructor = users(:instructor)
    @admin = users(:admin)
    @question = questions(:one)
  end

  # ── Student Access ────────────────────────────────────────────────────────
  test "student can view questions" do
    sign_in @student
    get questions_url
    assert_response :success
  end

  test "student cannot create questions" do
    sign_in @student
    assert_no_difference("Question.count") do
      post questions_url, params: { question: { question: "Test question?" } }
    end
    assert_response :forbidden
  end

  test "student cannot delete questions" do
    sign_in @student
    assert_no_difference("Question.count") do
      delete question_url(@question)
    end
    assert_response :forbidden
  end

  # ── Content Author Access ─────────────────────────────────────────────────
  test "content author can create questions" do
    sign_in @content_author
    assert_difference("Question.count") do
      post questions_url, params: {
        question: {
          question: "Test question with enough length?",
          choices: [{ content: "A", correct: true }, { content: "B", correct: false }],
          numChoices: 1
        }
      }
    end
    assert_response :created
  end

  # ── Instructor Access ─────────────────────────────────────────────────────
  test "instructor can create exercises" do
    sign_in @instructor
    assert_difference("Exercise.count") do
      post exercises_url, params: {
        exercise: {
          title: "Test Exercise",
          spec: { selection_rules: [{ type: "dynamic_tag", tag_uuid: tags(:one).uuid, count: 5 }] }
        }
      }
    end
    assert_response :created
  end

  # ── Admin Access ──────────────────────────────────────────────────────────
  test "admin can manage users" do
    sign_in @admin
    get users_url
    assert_response :success
  end

  test "non-admin cannot access user management" do
    sign_in @instructor
    get users_url
    assert_response :forbidden
  end
end
```

#### 8.1.3 Policy Assertions Test

```ruby
# test/policies/question_policy_test.rb
require "test_helper"

class QuestionPolicyTest < ActiveSupport::TestCase
  setup do
    @student = users(:student)
    @content_author = users(:content_author)
    @instructor = users(:instructor)
    @admin = users(:admin)
    @question = questions(:one)
  end

  # ── Index ─────────────────────────────────────────────────────────────────
  test "any authenticated user can list questions" do
    assert QuestionPolicy.new(@student, @question).index?
    assert QuestionPolicy.new(@content_author, @question).index?
    assert QuestionPolicy.new(@instructor, @question).index?
    assert QuestionPolicy.new(@admin, @question).index?
  end

  # ── Show ──────────────────────────────────────────────────────────────────
  test "any authenticated user can view a question" do
    assert QuestionPolicy.new(@student, @question).show?
    assert QuestionPolicy.new(@content_author, @question).show?
    assert QuestionPolicy.new(@instructor, @question).show?
    assert QuestionPolicy.new(@admin, @question).show?
  end

  # ── Create ────────────────────────────────────────────────────────────────
  test "only content authors, instructors, and admins can create questions" do
    assert_not QuestionPolicy.new(@student, Question.new).create?
    assert QuestionPolicy.new(@content_author, Question.new).create?
    assert QuestionPolicy.new(@instructor, Question.new).create?
    assert QuestionPolicy.new(@admin, Question.new).create?
  end

  # ── Update ────────────────────────────────────────────────────────────────
  test "only content authors, instructors, and admins can update questions" do
    assert_not QuestionPolicy.new(@student, @question).update?
    assert QuestionPolicy.new(@content_author, @question).update?
    assert QuestionPolicy.new(@instructor, @question).update?
    assert QuestionPolicy.new(@admin, @question).update?
  end

  # ── Destroy ───────────────────────────────────────────────────────────────
  test "only content authors, instructors, and admins can delete questions" do
    assert_not QuestionPolicy.new(@student, @question).destroy?
    assert QuestionPolicy.new(@content_author, @question).destroy?
    assert QuestionPolicy.new(@instructor, @question).destroy?
    assert QuestionPolicy.new(@admin, @question).destroy?
  end

  # ── Scope ─────────────────────────────────────────────────────────────────
  test "all users can see all questions in scope" do
    assert_equal Question.all, QuestionPolicy.new(@student, Question).scope.resolve
  end
end
```

#### 8.1.4 Token Expiry Test

```ruby
# test/integration/session_expiry_test.rb
require "test_helper"

class SessionExpiryTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:student)
  end

  test "session expires after timeout period" do
    sign_in @user
    get questions_url
    assert_response :success

    # Simulate time passing (30 minutes + 1 second)
    travel 31.minutes do
      get questions_url
      assert_redirected_to new_user_session_path
    end
  end

  test "remember me extends session" do
    sign_in @user, remember: true
    get questions_url
    assert_response :success

    # Simulate time passing (2 weeks - 1 day)
    travel 13.days do
      get questions_url
      assert_response :success
    end
  end
end
```

### 8.2 Frontend Tests (Cypress/Playwright)

#### 8.2.1 Dynamic Header Filtering Test

```javascript
// cypress/e2e/navigation.cy.js
describe("Global Navigation", () => {
  context("as a student", () => {
    beforeEach(() => {
      cy.loginAs("student");
      cy.visit("/");
    });

    it("should show basic navigation items", () => {
      cy.get("global-nav").within(() => {
        cy.contains("Workspace").should("be.visible");
        cy.contains("Questions").should("be.visible");
        cy.contains("Exercises").should("be.visible");
        cy.contains("Tags").should("be.visible");
      });
    });

    it("should not show admin navigation items", () => {
      cy.get("global-nav").within(() => {
        cy.contains("Users").should("not.exist");
      });
    });

    it("should display user role chip", () => {
      cy.get("global-nav").within(() => {
        cy.get(".MuiChip-label").should("contain", "student");
      });
    });
  });

  context("as an admin", () => {
    beforeEach(() => {
      cy.loginAs("admin");
      cy.visit("/");
    });

    it("should show all navigation items including admin", () => {
      cy.get("global-nav").within(() => {
        cy.contains("Workspace").should("be.visible");
        cy.contains("Questions").should("be.visible");
        cy.contains("Exercises").should("be.visible");
        cy.contains("Tags").should("be.visible");
        cy.contains("Users").should("be.visible");
      });
    });

    it("should display admin role chip", () => {
      cy.get("global-nav").within(() => {
        cy.get(".MuiChip-label").should("contain", "admin");
      });
    });
  });

  context("when not logged in", () => {
    it("should show sign in and register buttons", () => {
      cy.visit("/");
      cy.get("global-nav").within(() => {
        cy.contains("Sign In").should("be.visible");
        cy.contains("Register").should("be.visible");
      });
    });
  });
});
```

#### 8.2.2 CSRF Pipeline Test

```javascript
// cypress/e2e/csrf.cy.js
describe("CSRF Protection", () => {
  it("should include CSRF token in meta tag", () => {
    cy.visit("/");
    cy.get('meta[name="csrf-token"]').should("exist");
  });

  it("should include CSRF token in AJAX requests", () => {
    cy.loginAs("student");
    cy.visit("/questions");

    cy.intercept("POST", "/questions").as("createQuestion");
    // Trigger a POST request via the UI
    cy.get("[data-testid=create-question-button]").click();

    cy.wait("@createQuestion").then((interception) => {
      expect(interception.request.headers).to.have.property("x-csrf-token");
    });
  });

  it("should reject requests without valid CSRF token", () => {
    cy.loginAs("student");

    // Directly send a POST without CSRF token
    cy.request({
      method: "POST",
      url: "/questions",
      body: { question: "Test" },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(422);
    });
  });
});
```

### 8.3 Test Factories

```ruby
# test/factories/users.rb
FactoryBot.define do
  factory :user do
    email { Faker::Internet.unique.email }
    password { "Password123!" }
    password_confirmation { "Password123!" }
    display_name { Faker::Name.name }
    confirmed_at { Time.current }

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

# test/factories/roles.rb
FactoryBot.define do
  factory :role do
    name { "student" }

    trait :student do
      name { "student" }
    end

    trait :content_author do
      name { "content_author" }
    end

    trait :instructor do
      name { "instructor" }
    end

    trait :admin do
      name { "admin" }
    end
  end
end
```

---

## 9. Security Hardening

### 9.1 Session Security

```ruby
# config/initializers/session_store.rb
Rails.application.config.session_store :cookie_store,
  key: "_elearn_session",
  secure: Rails.env.production?,      # HTTPS only in production
  same_site: Rails.env.production? ? :strict : :lax,  # CSRF protection
  httponly: true,                      # No JavaScript access
  expire_after: 30.minutes             # Session timeout
```

### 9.2 CSRF Protection

```ruby
# app/controllers/application_controller.rb
class ApplicationController < ActionController::Base
  # Enable CSRF protection
  protect_from_forgery with: :exception

  # ... existing code
end
```

### 9.3 SQL Injection Prevention

```ruby
# All queries use ActiveRecord parameterized queries
# BAD - Never do this:
# User.where("email = '#{params[:email]}'")

# GOOD - Always do this:
User.where(email: params[:email])

# For complex queries, use Arel or sanitize_sql_array
```

### 9.4 XSS Prevention

```erb
<%# All output is auto-escaped in ERB templates %>
<%= user_input %>  <%# Safe - auto-escaped %>
<%= raw user_input %>  <%# Dangerous - only use with sanitized content %>
<%= sanitize user_input %>  <%# Safe - allows only whitelisted HTML %>
```

### 9.5 Rate Limiting

```ruby
# config/initializers/rack_attack.rb
class Rack::Attack
  # Limit login attempts
  throttle("logins/ip", limit: 5, period: 20.seconds) do |req|
    if req.path == "/users/sign_in" && req.post?
      req.ip
    end
  end

  # Limit registration attempts
  throttle("registrations/ip", limit: 3, period: 1.hour) do |req|
    if req.path == "/users" && req.post?
      req.ip
    end
  end

  # Block suspicious user agents
  blocklist("block suspicious agents") do |req|
    req.user_agent =~ /sqlmap|nikto|nmap/i
  end
end
```

### 9.6 Security Headers

```ruby
# config/initializers/secure_headers.rb
Rails.application.config.action_dispatch.default_headers = {
  "X-Frame-Options" => "DENY",
  "X-Content-Type-Options" => "nosniff",
  "X-XSS-Protection" => "1; mode=block",
  "Referrer-Policy" => "strict-origin-when-cross-origin",
  "Permissions-Policy" => "camera=(), microphone=(), geolocation=()"
}
```

---

## 10. Documentation & Deployment

### 10.1 API Documentation

```ruby
# config/routes.rb
Rails.application.routes.draw do
  # ── Authentication ────────────────────────────────────────────────────────
  devise_for :users, controllers: {
    sessions: "users/sessions",
    registrations: "users/registrations",
    passwords: "users/passwords",
    confirmations: "users/confirmations"
  }

  # ── Resources ────────────────────────────────────────────────────────────
  resources :questions
  resources :tag
  resources :exercises do
    member do
      get "start"
    end
  end

  # ── Admin Namespace ──────────────────────────────────────────────────────
  namespace :admin do
    resources :users, only: [:index, :show, :edit, :update, :destroy]
  end

  # ── API ──────────────────────────────────────────────────────────────────
  namespace :api do
    patch "classify_question", to: "classify_questions#update"
  end

  # ── Root ─────────────────────────────────────────────────────────────────
  root "workspace#show"
end
```

### 10.2 Deployment Checklist

```markdown
# Deployment Checklist

## Pre-Deployment
- [ ] Run `bundle exec rails db:migrate`
- [ ] Run `bundle exec rails db:seed` (create admin user)
- [ ] Run full test suite: `bundle exec rails test`
- [ ] Run security audit: `bundle exec brakeman`
- [ ] Update `.env` with production values:
  - `SECRET_KEY_BASE`
  - `DEVISE_PEPPER`
  - `MAILER_SENDER`
  - `DATABASE_URL`
  - `REDIS_URL` (if using Redis for sessions)

## Production Configuration
- [ ] Set `RAILS_ENV=production`
- [ ] Set `FORCE_SSL=true`
- [ ] Configure `config.action_mailer.default_url_options`
- [ ] Set up SSL certificate
- [ ] Configure CDN for assets (if applicable)

## Post-Deployment
- [ ] Verify admin login works
- [ ] Test registration flow
- [ ] Test password reset flow
- [ ] Verify role-based access control
- [ ] Monitor error tracking (Sentry, Bugsnag, etc.)
- [ ] Set up log aggregation
```

### 10.3 Monitoring & Logging

```ruby
# config/initializers/logging.rb
Rails.application.configure do
  # Log authentication events
  config.after_initialize do
    ActiveSupport::Notifications.subscribe "sign_in.action_controller" do |*args|
      event = ActiveSupport::Notifications::Event.new(*args)
      Rails.logger.info "[AUTH] User signed in: #{event.payload[:user_id]}"
    end

    ActiveSupport::Notifications.subscribe "sign_out.action_controller" do |*args|
      event = ActiveSupport::Notifications::Event.new(*args)
      Rails.logger.info "[AUTH] User signed out: #{event.payload[:user_id]}"
    end
  end
end
```

### 10.4 Environment Variables

```bash
# .env.production
SECRET_KEY_BASE=your-secret-key-here
DEVISE_PEPPER=your-devise-pepper-here
MAILER_SENDER=noreply@elearn-ngx.com
DATABASE_URL=postgresql://user:pass@host:5432/elearn_ngx_production
REDIS_URL=redis://localhost:6379/0
FORCE_SSL=true
RAILS_LOG_LEVEL=info
```

---

## Dependencies & Risk Mitigations

### Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| devise | ~> 4.9 | Authentication |
| pundit | ~> 2.4 | Authorization |
| rolify | ~> 6.0 | Role management |
| rack-attack | ~> 6.7 | Rate limiting |
| secure_headers | ~> 6.5 | Security headers |

### Risk Mitigations

| Risk | Mitigation |
|------|------------|
| Mass assignment of roles | Explicit parameter sanitization in ApplicationController |
| Session hijacking | Secure cookie flags, HTTPS-only in production |
| Brute force attacks | Devise lockable, rack-attack rate limiting |
| CSRF attacks | Rails CSRF protection, SameSite cookies |
| XSS attacks | Auto-escaping in ERB, Content Security Policy |
| SQL injection | Parameterized queries via ActiveRecord |
| Privilege escalation | Pundit policies, role validation in controllers |

---

## Implementation Timeline

### Phase 1: Foundation (Week 1)
- Install and configure Devise, Pundit, Rolify
- Create User and Role models
- Run migrations
- Set up seed data

### Phase 2: Authentication (Week 2)
- Implement Devise views and layouts
- Configure session store
- Add parameter sanitization
- Write authentication tests

### Phase 3: Authorization (Week 3)
- Create Pundit policies
- Add authorization guards to controllers
- Write policy tests
- Test role-based access

### Phase 4: Frontend Integration (Week 4)
- Create GlobalNav island component
- Update application layout
- Add user metadata helper
- Write frontend tests

### Phase 5: Security Hardening (Week 5)
- Add rate limiting
- Configure security headers
- Run security audit
- Fix any vulnerabilities

### Phase 6: Testing & Deployment (Week 6)
- Complete test coverage
- Performance testing
- Deploy to staging
- Deploy to production

---

## Appendix: Complete Authorization Matrix

| Resource | Action | Student | Content Author | Instructor | Admin |
|----------|--------|---------|----------------|------------|-------|
| **Question** | index | ✅ | ✅ | ✅ | ✅ |
| | show | ✅ | ✅ | ✅ | ✅ |
| | create | ❌ | ✅ | ✅ | ✅ |
| | update | ❌ | ✅ | ✅ | ✅ |
| | destroy | ❌ | ✅ | ✅ | ✅ |
| **Exercise** | index | ✅ | ✅ | ✅ | ✅ |
| | show | ✅ | ✅ | ✅ | ✅ |
| | start | ✅ | ✅ | ✅ | ✅ |
| | create | ❌ | ❌ | ✅ | ✅ |
| | update | ❌ | ❌ | ✅ | ✅ |
| | destroy | ❌ | ❌ | ✅ | ✅ |
| **Tag** | index | ✅ | ✅ | ✅ | ✅ |
| | show | ✅ | ✅ | ✅ | ✅ |
| | create | ❌ | ✅ | ✅ | ✅ |
| | update | ❌ | ✅ | ✅ | ✅ |
| | destroy | ❌ | ✅ | ✅ | ✅ |
| **Workspace** | show | ✅ | ✅ | ✅ | ✅ |
| **User** | index | ❌ | ❌ | ❌ | ✅ |
| | show | ❌ | ❌ | ❌ | ✅ |
| | create | ❌ | ❌ | ❌ | ✅ |
| | update | ❌ | ❌ | ❌ | ✅ |
| | destroy | ❌ | ❌ | ❌ | ✅ |
| | manage_roles | ❌ | ❌ | ❌ | ✅ |

---

*Document Version: 1.0*
*Last Updated: 2026-06-05*
*Author: OWL Architect*
