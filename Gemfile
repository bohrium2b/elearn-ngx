source "https://rubygems.org"
git_source(:github) { |repo| "https://github.com/#{repo}.git" }

ruby "~> 3.3"

# ── Core ──────────────────────────────────────────────────────────────────────
gem "rails", "~> 7.2"
gem "pg", "~> 1.5"
gem "puma", "~> 6.4"

# ── Frontend pipeline (Vite + React) ──────────────────────────────────────────
gem "vite_rails", "~> 3.0"

# ── Application features ──────────────────────────────────────────────────────
gem "turbo-rails"
gem "stimulus-rails"
gem "jbuilder"

# ── Redis (for Action Cable / caching) ────────────────────────────────────────
# gem "redis", ">= 4.0.1"

# ── Authentication ────────────────────────────────────────────────────────────
# gem "devise"

# ── Performance ───────────────────────────────────────────────────────────────
gem "bootsnap", require: false
gem "tzinfo-data", platforms: %i[windows jruby]

# ── Development & Test ────────────────────────────────────────────────────────
group :development, :test do
  gem "debug", platforms: %i[mri windows]
  gem "factory_bot_rails"
  gem "faker"
end

group :development do
  gem "web-console"
  gem "rubocop", require: false
  gem "rubocop-rails", require: false
  gem "rubocop-performance", require: false
end

group :test do
  gem "capybara"
  gem "selenium-webdriver"
end
