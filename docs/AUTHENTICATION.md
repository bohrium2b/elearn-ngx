# Authentication & Authorization Documentation

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [User Roles](#user-roles)
- [Authorization](#authorization)
- [Devise Configuration](#devise-configuration)
- [Role Management](#role-management)
- [Permission Patterns](#permission-patterns)

## Overview

elearn-ngx uses Devise for authentication and Rolify for role-based authorization. The system supports four user roles with different permission levels.

---

## Authentication

### Devise Modules

The User model includes the following Devise modules:

```ruby
devise :database_authenticatable, :registerable,
       :recoverable, :rememberable, :validatable,
       :trackable
```

| Module | Description |
|--------|-------------|
| `database_authenticatable` | Stores encrypted password in database |
| `registerable` | Allows self-registration |
| `recoverable` | Password reset functionality |
| `rememberable` | Remember me functionality |
| `validatable` | Email and password validation |
| `trackable` | Tracks sign in count, timestamps, IP |

### Authentication Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/users/sign_in` | Sign in |
| DELETE | `/users/sign_out` | Sign out |
| POST | `/users` | Register new account |
| GET | `/users/sign_in` | Sign in form |
| GET | `/users/sign_up` | Registration form |
| GET | `/users/password/new` | Password reset request |
| POST | `/users/password` | Send password reset email |
| GET | `/users/password/edit` | Password reset form |
| PATCH | `/users/password` | Update password |

### Sign In Flow

1. User submits credentials to `/users/sign_in`
2. Devise validates credentials
3. On success:
   - Session is created
   - User is redirected to stored location or root path
4. On failure:
   - Sign in form is re-rendered with errors

### Registration Flow

1. User submits registration form to `/users`
2. Devise validates and creates user
3. Default `student` role is assigned
4. On success:
   - User is signed in
   - Redirected to root path
5. On failure:
   - Registration form is re-rendered with errors

### Password Reset Flow

1. User requests password reset at `/users/password/new`
2. Devise sends reset email with token
3. User clicks link to `/users/password/edit`
4. User submits new password
5. Password is updated and user is signed in

---

## User Roles

The system uses four predefined roles:

| Role | Description | Capabilities |
|------|-------------|--------------|
| `student` | Default role for new users | View content, track own progress |
| `content_author` | Content creators | Create and manage questions, exercises, content |
| `instructor` | Teachers/mentors | View all student data, cohort analytics |
| `admin` | System administrators | Full system access, user management |

### Role Hierarchy

```
admin
  └── instructor
        └── content_author
              └── student
```

**Note:** The hierarchy is logical, not technical. Each role must be explicitly assigned.

### Role Methods

```ruby
user.student?           # Check if user has student role
user.content_author?    # Check if user has content author role
user.instructor?        # Check if user has instructor role
user.admin?             # Check if user has admin role
user.role_name          # Returns first role name or "student"
```

### Default Role Assignment

New users automatically receive the `student` role:

```ruby
after_create :assign_default_role

def assign_default_role
  add_role(:student) if roles.blank?
end
```

---

## Authorization

### Pundit Integration

The application uses Pundit for authorization policies.

**Application Controller:**
```ruby
include Pundit::Authorization
after_action :verify_authorized
rescue_from Pundit::NotAuthorizedError, with: :user_not_authorized
```

### Authorization Patterns

#### Controller-Level Authorization

```ruby
class QuestionsController < ApplicationController
  before_action :authenticate_user!, except: %i[index show]
  after_action :verify_authorized, except: :index
  
  def show
    @question = find_question_by_param(params[:id])
    authorize @question  # Uses QuestionPolicy
  end
end
```

#### Role-Based Authorization

```ruby
def can_view_instructor_data?
  current_user.instructor? || current_user.admin?
end

def verify_admin
  return if current_user.admin?
  flash[:alert] = t("messages.not_authorized")
  redirect_to root_path
end
```

#### Policy-Based Authorization

```ruby
# In controller
authorize @question  # Uses QuestionPolicy
authorize :workspace, :show?  # Uses WorkspacePolicy

# In API controllers
authorize @session  # Uses AssessmentSessionPolicy
```

### Permission Matrix

| Feature | Student | Content Author | Instructor | Admin |
|---------|---------|----------------|------------|-------|
| View questions | ✅ | ✅ | ✅ | ✅ |
| Create questions | ❌ | ✅ | ✅ | ✅ |
| View own analytics | ✅ | ✅ | ✅ | ✅ |
| View all analytics | ❌ | ❌ | ✅ | ✅ |
| View cohort data | ❌ | ❌ | ✅ | ✅ |
| Manage users | ❌ | ❌ | ❌ | ✅ |
| Manage taxonomy | ❌ | ❌ | ❌ | ✅ |

---

## Devise Configuration

### Parameter Sanitization

**Application Controller:**
```ruby
def configure_permitted_parameters
  devise_parameter_sanitizer.permit(:sign_up, keys: %i[username email])
  devise_parameter_sanitizer.permit(:account_update, keys: %i[username email avatar_url])
end
```

**Custom Parameter Sanitizer:**
```ruby
def devise_parameter_sanitizer
  if resource_class == User
    User::ParameterSanitizer.new(User, :user, params)
  else
    super
  end
end
```

### User Validations

```ruby
validates :username, presence: true, uniqueness: true,
                     length: { minimum: 3, maximum: 30 },
                     format: { with: /\A[a-zA-Z0-9_]+\z/ }
validates :email, presence: true, uniqueness: true
```

### Username Requirements

- Required
- Unique
- 3-30 characters
- Only letters, numbers, and underscores allowed

---

## Role Management

### Role Model

```ruby
class Role < ApplicationRecord
  has_and_belongs_to_many :users, join_table: :users_roles
  belongs_to :resource, polymorphic: true, optional: true
  
  validates :name, presence: true, uniqueness: true
  validates :name, inclusion: { in: %w[student content_author instructor admin] }
end
```

### Assigning Roles

```ruby
# Add role to user
user.add_role(:instructor)

# Remove role from user
user.remove_role(:student)

# Check if user has role
user.has_role?(:admin)

# Get all user roles
user.roles
```

### Role Transfer

When updating users via admin interface:

```ruby
def user_params
  params.require(:user).permit(:username, :email, :avatar_url, role_ids: [])
end
```

---

## Permission Patterns

### Controller Authentication

```ruby
# Require authentication for all actions
before_action :authenticate_user!

# Require authentication except specific actions
before_action :authenticate_user!, except: %i[index show]
```

### Controller Authorization

```ruby
# Verify authorization after actions
after_action :verify_authorized, except: :index

# Skip verification for specific actions
after_action :verify_authorized, except: %i[index show]
```

### Conditional Access

```ruby
def dashboard
  @student_analytics = StudentAnalytics.new(current_user)
  # All authenticated users can view their own dashboard
end

def cohort
  unless can_view_instructor_data?
    return redirect_to dashboard_analytics_path,
                       alert: t("messages.not_authorized_cohort")
  end
  # Only instructors and admins can view cohort data
end
```

### API Authorization

```ruby
rescue_from Pundit::NotAuthorizedError, with: :user_not_authorized_api

def user_not_authorized_api
  render json: { error: t("messages.not_authorized") }, status: :forbidden
end
```

### Session-Based Access Control

```ruby
def can_review?(session)
  session.user_id == current_user.id || 
  current_user.instructor? || 
  current_user.admin?
end
```

---

## Security Considerations

### CSRF Protection

```ruby
protect_from_forgery with: :exception
```

**Exception for API controllers:**
```ruby
protect_from_forgery with: :null_session
```

### Browser Version Control

```ruby
allow_browser versions: :modern
```

### Parameter Filtering

```ruby
# In config/initializers/filter_parameter_logging.rb
Rails.application.config.filter_parameters += [:password, :password_confirmation]
```

### Secure Password Storage

Devise uses bcrypt for password hashing with a minimum cost factor in production.

---

## Testing Authentication

### Controller Tests

```ruby
# Sign in user
sign_in user

# Sign out user
sign_out user

# Check authentication
assert user_signed_in?
```

### Integration Tests

```ruby
# Visit sign in page
visit new_user_session_path

# Fill in credentials
fill_in "Email", with: user.email
fill_in "Password", with: "password"
click_button "Sign in"

# Verify redirect
assert_equal root_path, current_path
```

### Policy Tests

```ruby
# Test policy authorization
policy = QuestionPolicy.new(user, question)
assert policy.show?
assert policy.update? if user.content_author?
```
