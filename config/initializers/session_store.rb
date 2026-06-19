# frozen_string_literal: true

# Session cookie configuration
# Development: relaxed settings for local Vite dev server compatibility
# Production: secure flags enabled for security
if Rails.env.development?
  Rails.application.config.session_store :cookie_store,
                                         key: "_elearn_session",
                                         same_site: :lax,
                                         secure: false,
                                         httponly: true
else
  Rails.application.config.session_store :cookie_store,
                                         key: "_elearn_session",
                                         same_site: :lax,
                                         secure: true,
                                         httponly: true
end
