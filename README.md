# elearn-ngx

> A Ruby on Rails application using an **Islands Architecture** for interactive UI — React + MUI components mounted as native HTML5 Web Components (Custom Elements) inside server-rendered Rails views.

---

## Architecture Overview

```
Rails server-rendered HTML
  └── <hello-island data-props='{"greeting":"Hi"}'></hello-island>
          ↑ Custom Element (Web Component) registered by web_components.ts
          └── React component wrapped in MUI ThemeProvider
```

| Layer | Technology |
|---|---|
| Server rendering | Ruby on Rails 7.2 |
| Database | PostgreSQL 16 |
| Frontend bundler | Vite (via `vite_rails` gem) |
| Interactive islands | React 18 + MUI v5 |
| Custom Elements glue | Native HTML5 Web Components API |
| CSS | Tailwind CSS (optional) + MUI |
| Turbo compatibility | `root.unmount()` in `disconnectedCallback` |

---

## Getting Started

### Prerequisites

- Ruby 3.3+
- Node.js 20+
- PostgreSQL 16
- Yarn or npm

### With Dev Container (recommended)

Open this repository in VS Code and click **"Reopen in Container"** — the devcontainer will install all dependencies automatically.

### Manual Setup

```bash
# 1. Clone
git clone https://github.com/bohrium2b/elearn-ngx.git
cd elearn-ngx

# 2. Install Ruby + JS deps
bundle install
yarn install

# 3. Configure environment
cp .env.example .env
# Edit .env with your Postgres credentials

# 4. Setup database
bin/rails db:prepare

# 5. Start servers (Rails + Vite)
bin/rails server              # http://localhost:3000
yarn dev                      # Vite HMR on http://localhost:3036
```

---

## Adding a New React Island

1. Create `app/frontend/components/islands/my-widget.tsx`:

```tsx
export const tagName = "my-widget";

interface MyWidgetProps { label?: string }

export default function MyWidget({ label = "Hello" }: MyWidgetProps) {
  return <div>{label}</div>;
}
```

2. Use it in any Rails ERB view:

```erb
<%= react_island_tag("my-widget", { label: "Click me" }) %>
```

That's it — `web_components.ts` auto-discovers the file and registers `<my-widget>` as a Custom Element.

---

## Development

| Command | Description |
|---|---|
| `bin/rails server` | Start Rails dev server |
| `yarn dev` | Start Vite dev server (HMR) |
| `bundle exec rubocop` | Ruby linting |
| `yarn tsc --noEmit` | TypeScript type-check |
| `yarn lint` | ESLint |
| `bundle exec rails test` | Run all Rails tests |

---

## CI

GitHub Actions runs on every push/PR:
- RuboCop (Ruby linting)
- TypeScript compile-check (`tsc --noEmit`)
- ESLint
- Rails test suite (with PostgreSQL service container)

