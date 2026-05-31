# Development-only session cookie settings to allow cross-site requests from
# the local Vite dev server when using the GitHub Codespaces / app.github.dev proxy.
if Rails.env.development?
  Rails.application.config.session_store :cookie_store,
                                         key: "_elearn_session",
                                         same_site: :none,
                                         secure: true
end
