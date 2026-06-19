# frozen_string_literal: true

require "active_support/core_ext/integer/time"

Rails.application.configure do
  # ── Code Loading ──────────────────────────────────────────────────────────
  config.enable_reloading = true
  config.eager_load = false
  config.consider_all_requests_local = true

  # ── Assets ────────────────────────────────────────────────────────────────
  config.assets.debug = true
  config.assets.quiet = true

  # ── Server ────────────────────────────────────────────────────────────────
  config.server_timing = true

  # ── Caching ───────────────────────────────────────────────────────────────
  if Rails.root.join("tmp/caching-dev.txt").exist?
    config.action_controller.perform_caching = true
    config.cache_store = :memory_store
    config.public_file_server.headers = { "cache-control" => "public, max-age=#{2.days.to_i}" }
  else
    config.action_controller.perform_caching = false
    config.cache_store = :null_store
  end

  # ── Mailer ────────────────────────────────────────────────────────────────
  config.action_mailer.raise_delivery_errors = false
  config.action_mailer.perform_caching = false
  config.action_mailer.default_url_options = { host: "localhost", port: 3000 }

  # ── Logging ───────────────────────────────────────────────────────────────
  config.log_level = :debug
  config.log_tags = [:request_id]
  config.logger = ActiveSupport::TaggedLogging.new(Logger.new($stdout))

  # ── Raise errors for missing translations ─────────────────────────────────
  config.i18n.raise_on_missing_translations = true

  # ── Annotate rendered view with file names ────────────────────────────────
  config.action_view.annotate_rendered_view_with_filenames = true

  # ── Raise error on unpermitted parameters ─────────────────────────────────
  config.action_controller.raise_on_missing_callback_actions = true

  # -- HOSTS -──────────────────────────────────────────────────────────────
  config.hosts << "curly-memory-pqr65q7xgjwc7jv7-3000.app.github.dev"
  config.hosts << "localhost:3000"
  config.hosts << "127.0.0.1:3000"
  # Allow origin mismatch for local development behind the Codespaces/GitHub proxy
  # and permit the forwarded app.github.dev host for Action Cable connections.
  config.action_controller.forgery_protection_origin_check = false
  config.action_cable.allowed_request_origins = [
    "http://localhost:3000",
    %r{\Ahttps://.*\.app.github.dev(:\d+)?\z}
  ]
end
