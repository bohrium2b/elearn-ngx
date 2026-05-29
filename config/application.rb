require_relative "boot"

require "rails/all"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module ElearnNgx
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 7.2

    # ── Autoloading ────────────────────────────────────────────────────────────
    # config.autoload_lib(ignore: %w[assets tasks])

    # ── Timezone & Locale ──────────────────────────────────────────────────────
    config.time_zone = "UTC"
    config.i18n.default_locale = :en

    # ── Generators ─────────────────────────────────────────────────────────────
    config.generators do |g|
      g.orm :active_record, primary_key_type: :uuid
      g.test_framework :minitest
      g.fixture_replacement :factory_bot, dir: "test/factories"
    end
  end
end
