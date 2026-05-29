require "active_support/core_ext/integer/time"

Rails.application.configure do
  # ── Code Loading ──────────────────────────────────────────────────────────
  config.enable_reloading = false
  config.eager_load = true
  config.consider_all_requests_local = false
  config.action_controller.perform_caching = true

  # ── Logging ───────────────────────────────────────────────────────────────
  config.log_level = ENV.fetch("RAILS_LOG_LEVEL", "info")
  config.log_tags = [:request_id]

  # ── SSL ───────────────────────────────────────────────────────────────────
  config.force_ssl = true

  # ── Assets ────────────────────────────────────────────────────────────────
  config.public_file_server.enabled = ENV["RAILS_SERVE_STATIC_FILES"].present?

  # ── Mailer ────────────────────────────────────────────────────────────────
  config.action_mailer.perform_caching = false

  # ── I18n ──────────────────────────────────────────────────────────────────
  config.i18n.fallbacks = true

  # ── Deprecation notices ───────────────────────────────────────────────────
  config.active_support.report_deprecations = false
end
