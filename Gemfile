source "https://rubygems.org"
git_source(:github) { |repo| "https://github.com/#{repo}.git" }

ruby "~> 3.3"

# ── Core ──────────────────────────────────────────────────────────────────────
gem "pg", "~> 1.5"
gem "puma", "~> 6.4"
gem "rails", "~> 7.2"
gem "sprockets-rails"

# ── Frontend pipeline (Vite + React) ──────────────────────────────────────────
gem "vite_rails", "~> 3.0"

# ── Application features ──────────────────────────────────────────────────────
gem "jbuilder"
gem "stimulus-rails"
gem "turbo-rails"

# ── Redis (for Action Cable / caching) ────────────────────────────────────────
# gem "redis", ">= 4.0.1"

# ── Authentication & Authorization ───────────────────────────────────────────
gem "devise", "~> 4.9"
gem "pundit", "~> 2.3"
gem "rolify", "~> 6.0"

# ── Performance ───────────────────────────────────────────────────────────────
gem "bootsnap", require: false
gem "tzinfo-data", platforms: %i[windows jruby]

# ── Asset Pipeline ─────────────────────────────────────────────────────────────
gem "dartsass-rails"

# ── Development & Test ────────────────────────────────────────────────────────
group :development, :test do
  gem "debug", platforms: %i[mri windows]
  gem "factory_bot_rails"
  gem "faker"
  gem "minitest", "~> 5.27"
end

group :development do
  gem "dotenv-rails", require: false
  gem "rubocop", require: false
  gem "rubocop-performance", require: false
  gem "rubocop-rails", require: false
  gem "ruby-lsp", require: false
  gem "web-console"
end

group :test do
  gem "capybara"
  gem "selenium-webdriver"
end

gem "kaminari", "~> 1.2"
