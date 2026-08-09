# frozen_string_literal: true

require "active_support/core_ext/integer/time"

Rails.application.configure do
  # ── Code Loading ──────────────────────────────────────────────────────────
  config.enable_reloading = false
  config.eager_load = true
  config.consider_all_requests_local = true
  config.action_controller.perform_caching = false
  config.cache_store = :memory_store

  # ── Exceptions ────────────────────────────────────────────────────────────
  config.action_dispatch.show_exceptions = :rescuable

  # ── Mailer ────────────────────────────────────────────────────────────────
  config.action_mailer.perform_caching = false
  config.action_mailer.delivery_method = :test

  # ── Logging ───────────────────────────────────────────────────────────────
  config.log_level = :debug

  # ── Assets ────────────────────────────────────────────────────────────────
  config.assets.paths << Rails.root.join("test/fixtures/files")

  # ── Raise errors on unpermitted parameters ────────────────────────────────
  config.action_controller.raise_on_missing_callback_actions = true
end
