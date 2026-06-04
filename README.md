# elearn-ngx

A modern, interactive economics learning platform --- **the next generation of [eLearn Economics](https://elearneconomics.com/)**.

<img width="1637" height="1006" alt="image" src="https://github.com/user-attachments/assets/2c5a1f74-34d9-4319-9152-1f32488b3253" />
*(Why does the screenshot have SAT questions, you may ask? The answer is simple: because I can. Also because it allows me to try out bigger passage questions and different types of formatting, etc.)*

Built for students and teachers of NZ economics, elearn-ngx takes everything that worked about the original eLearn Economics and makes it better (if I do say so myself): cleaner question editing, proper LaTeX rendering, flexible exercise creation, and powerful tag-based organisation.

## What's Better

elearn-ngx (the "ngx" stands for "now good xtreme") improves on the original in several key ways:

- **Better MCQ Experience** — Real LaTeX/MathJax rendering in questions and answers
- **Smarter Exercise Randomisation** — Full control over how exercises are built: pick specific static questions, randomly select from tag branches, or mix both approaches
- **Tag Organisation** — Organise questions into hierarchical tags (e.g., Microeconomics → Supply & Demand → Elasticity) for easy browsing and targeted practice
- **Good Question Editor** — Write questions with Markdown support, preview LaTeX in real-time, and manage multiple choice options with ease. Add hints and answer rationale.

## Features

- **Questions** — Create and edit multi-choice questions with Markdown and LaTeX support
- **Exercises** — Build randomised exercises with flexible selection rules (by tag, static questions, or both)
- **Tags** — Hierarchical tagging system for organising questions by topic
- **Workspace** — Drag-and-drop dashboard for managing questions and their tag assignments
- **Interactive Player** — Khan Academy Perseus-powered exercise player with hints and feedback

## The future
- **Article Module** - MDX-based article rendering
- **Macro organisation** - attach articles to exercises and tags, and organise articles into topics and course flows
- **Reporting** - keep track of your progress over time :)

## Architecture

- **Backend:** Ruby on Rails 7.2 with PostgreSQL
- **Frontend:** React 18 "islands" architecture with MUI components
- **Build Tool:** Vite for fast frontend bundling and HMR
- **Math Rendering:** MathJax v4 and somehow v3 (maybe ...) / KaTeX for beautiful equations
- **Exercise Engine:** Khan Academy Perseus for interactive question playback

## Manual Setup

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
- ESLint
- Rails test suite (with PostgreSQL service container)
