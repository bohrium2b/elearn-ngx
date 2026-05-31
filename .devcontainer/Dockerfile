# Base image: Ubuntu 22.04 (Jammy)
FROM mcr.microsoft.com/devcontainers/base:jammy

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    libssl-dev \
    libreadline-dev \
    zlib1g-dev \
    libyaml-dev \
    libffi-dev \
    libgdbm-dev \
    libncurses5-dev \
    libgmp-dev \
    libpq-dev \
    libjemalloc-dev \
    pkg-config \
    imagemagick \
    && rm -rf /var/lib/apt/lists/*

# Install Postgres server
RUN apt-get update && apt-get install -y postgresql postgresql-contrib postgresql-client
# Start Postgres service and create user/database
RUN service postgresql start && \
    su - postgres -c "psql -c \"CREATE ROLE dev WITH LOGIN PASSWORD 'dev';\"" && \
    su - postgres -c "psql -c \"ALTER ROLE dev CREATEDB;\"" && \
    su - postgres -c "psql -c \"CREATE DATABASE elearn_dev OWNER dev;\"" && \
    su - postgres -c "psql -c \"CREATE DATABASE elearn_test OWNER dev;\""
    
# ── Ruby 3.3 via rbenv ────────────────────────────────────────────────────────
ENV RUBY_VERSION=3.3.3
ENV RBENV_ROOT=/usr/local/rbenv
ENV PATH="$RBENV_ROOT/bin:$RBENV_ROOT/shims:$PATH"

RUN git clone https://github.com/rbenv/rbenv.git $RBENV_ROOT && \
    git clone https://github.com/rbenv/ruby-build.git $RBENV_ROOT/plugins/ruby-build && \
    rbenv install $RUBY_VERSION && \
    rbenv global $RUBY_VERSION && \
    gem update --system && \
    gem install bundler

# Install ruby-lsp
RUN gem install ruby-lsp

# Grant write permissions to the gem installation directory for the dev user
RUN chmod -R 755 $RBENV_ROOT

# ── Node.js 20 via nvm ────────────────────────────────────────────────────────
ENV NODE_VERSION=20
RUN curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - && \
    apt-get install -y nodejs && \
    npm install -g yarn

# ── Set working directory ─────────────────────────────────────────────────────
WORKDIR /workspace

# Copy manifests first for layer caching
COPY Gemfile Gemfile.lock* ./
COPY package.json yarn.lock* ./

# Install dependencies at build time (re-installed in postCreateCommand anyway)
RUN bundle install || true
RUN yarn install || true
