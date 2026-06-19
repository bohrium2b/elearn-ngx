# elearn-ngx

A modern, interactive economics learning platform — **the next generation of [eLearn Economics](https://elearneconomics.com/)**.

<img width="1637" height="1006" alt="image" src="https://github.com/user-attachments/assets/2c5a1f74-34d9-4319-9152-1f32488b3253" />

*(Why does the screenshot have SAT questions, you may ask? The answer is simple: because I can. Also because it allows me to try out bigger passage questions and different types of formatting, etc.)*

Built for students and teachers of NZ economics, elearn-ngx takes everything that worked about the original eLearn Economics and makes it better: cleaner question editing, proper LaTeX rendering, flexible exercise creation, powerful tag-based organisation, and comprehensive analytics.

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture Overview](#architecture-overview)
- [Installation](#installation)
- [Development](#development)
- [Testing](#testing)
- [Documentation](#documentation)
- [CI/CD](#cicd)
- [Future Roadmap](#future-roadmap)
- [Key Improvements Over Original](#key-improvements-over-original)

## Features

### Core Features

- **Question Management** — Create and edit multi-choice questions with Markdown and LaTeX/MathJax support, hints, and answer rationales
- **Exercise System** — Build randomised exercises with flexible selection rules (dynamic tag-based, static questions, or mixed)
- **Tagging System** — Hierarchical tag organisation for categorising questions by topic
- **Taxonomy System** — Four-level curriculum hierarchy (Course → Part → Unit → Topic) for structured learning pathways
- **Workspace** — Drag-and-drop dashboard for managing questions and their tag assignments
- **Interactive Player** — Khan Academy Perseus-powered exercise player with hints and feedback
- **Learning Pathways** — Gamified linear pathway view with progress tracking
- **Practice Exercises** — Auto-generated exercises targeting weak areas based on performance history

### Analytics & Reporting

- **Student Analytics** — Dashboard summary, chronological ledger, weak points identification, personalised recommendations, topic-based performance tracking, and mastery level classification
- **Instructor/Admin Analytics** — Cohort metrics, tag performance matrix, item discrimination metrics, performance logs, topic performance matrices, and difficulty rankings
- **Assessment Sessions** — Detailed telemetry data including question responses, tag registry, and topic registry

### User Roles & Permissions

Role-Based Access Control (RBAC) with four roles:

| Role | Description |
|------|-------------|
| `student` | Default role, can view content and track own progress |
| `content_author` | Can create and manage questions, exercises, and content |
| `instructor` | Can view all student data, cohort analytics, and performance logs |
| `admin` | Full system access, can manage users and taxonomy |

## Technology Stack

- **Backend:** Ruby on Rails 7.2 with PostgreSQL
- **Frontend:** React 18 "islands" architecture with MUI components
- **Build Tool:** Vite for fast frontend bundling and HMR
- **Math Rendering:** MathJax v4 and KaTeX for beautiful equations
- **Exercise Engine:** Khan Academy Perseus for interactive question playback
- **Authentication:** Devise with role-based access control
- **Authorization:** Pundit policies

## Architecture Overview

### Backend Architecture

```
app/
├── controllers/       # Rails controllers (Questions, Exercises, Tags, Workspace, Analytics, etc.)
├── models/            # ActiveRecord models (Question, Exercise, Tag, TaxonomyNode, etc.)
├── services/          # Service objects (ExerciseResolver, TelemetryProcessor, Analytics, etc.)
├── views/             # ERB templates for server-rendered pages
└── frontend/          # React frontend code
    ├── components/    # React components
    │   ├── islands/   # Web components (islands architecture)
    │   ├── workspace/ # Workspace-specific components
    │   ├── taxonomy/  # Taxonomy browsing components
    │   └── perseus/   # Perseus renderer components
    └── entrypoints/   # Vite entry points
```

### Frontend Architecture (Islands Pattern)

React components are mounted as web components on server-rendered pages:

- `<workspace-dashboard>` — Main drag-and-drop interface
- `<course-library>` — Hierarchical browser for courses
- `<course-pathway>` — Gamified linear pathway view
- `<course-assembler>` — Admin drag-and-drop dashboard
- `<interactive-player>` — Perseus-powered exercise player
- `<question-renderer>` — Individual question display
- `<student-analytics>` — Student-facing analytics dashboard
- `<educator-dashboard>` — Instructor analytics dashboard

### Database Schema

Key models and relationships:

- **User** — Has roles (student, content_author, instructor, admin), has many assessment sessions
- **Question** — Has UUID/slug, config_data JSON, many-to-many with tags
- **Exercise** — Has UUID/slug, spec JSON with selection rules, many-to-many with topics
- **Tag** — Hierarchical structure, many-to-many with questions
- **TaxonomyNode** — Four-level hierarchy (course, part, unit, topic), self-referential
- **AssessmentSession** — Tracks user performance with telemetry data

### Service Objects

Key service objects for business logic:

- **ExerciseResolver** — Resolves exercise specs into actual questions at runtime
- **PracticeExerciseGenerator** — Generates personalised practice exercises targeting weak areas
- **TelemetryProcessor** — Processes assessment session telemetry data
- **StudentAnalytics** — Provides analytics and insights for individual students
- **AnalyticsAggregator** — Provides system-wide analytics for instructors/admins
- **AnalyticsCacheWarmer** — Pre-computes and caches expensive analytics queries

## Installation

### Prerequisites

- Ruby 3.x
- PostgreSQL
- Node.js 18+
- Yarn

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

### Docker Setup (Optional)

The project includes a `.devcontainer` configuration for VS Code Dev Containers.

## Development

| Command | Description |
|---------|-------------|
| `bin/rails server` | Start Rails dev server |
| `yarn dev` | Start Vite dev server (HMR) |
| `bundle exec rubocop` | Ruby linting |
| `yarn tsc --noEmit` | TypeScript type-check |
| `yarn lint` | ESLint |
| `bundle exec rails test` | Run all Rails tests |

### Key URL Patterns

- Questions: `/questions/:uuid-x:slug`
- Tags: `/tag/:uuid-x:slug`
- Exercises: `/exercises/:uuid-x:slug`
- Exercise start: `/exercises/:id/start`
- Taxonomy: `/taxonomy/:uuid-x:slug`
- Learning Pathways: `/learning_pathways/:id`
- Workspace: `/` (root)
- Analytics Dashboard: `/analytics/dashboard`

### Code Conventions

#### Ruby/Rails
- Use frozen string literals in service objects
- Service objects go in `app/services/`
- Use `respond_to` blocks for multi-format responses
- Validate with custom methods in models

#### TypeScript/React
- Use functional components with hooks
- Export types from dedicated `types.ts` files
- Use `@/` alias for imports (maps to `app/frontend/`)
- Islands export `tagName` for web component registration

## Testing

```bash
# Run all Rails tests
bundle exec rails test

# Run specific test files
rails test test/models/question_test.rb
rails test test/controllers/questions_controller_test.rb
rails test test/services/exercise_resolver_test.rb

# Frontend tests (Vitest)
yarn test
```

### Test Structure

- **Model Tests** — Validations, associations, scopes, and instance methods
- **Controller Tests** — Authentication, authorization, response formats
- **Service Tests** — Business logic, edge cases, data transformations
- **Integration Tests** — End-to-end workflows with Capybara
- **Component Tests** — React component rendering and interactions

## Documentation

Comprehensive documentation is available in the `docs/` directory:

| Document | Description |
|----------|-------------|
| [docs/FEATURES.md](docs/FEATURES.md) | Detailed features overview with examples |
| [docs/API.md](docs/API.md) | Complete API documentation with endpoints and response formats |
| [docs/MODELS.md](docs/MODELS.md) | Model documentation with attributes, associations, and validations |
| [docs/SERVICES.md](docs/SERVICES.md) | Service objects documentation |
| [docs/CONTROLLERS.md](docs/CONTROLLERS.md) | Controller documentation with actions and authorization |
| [docs/AUTHENTICATION.md](docs/AUTHENTICATION.md) | Authentication and authorization guide |
| [docs/FRONTEND.md](docs/FRONTEND.md) | Frontend architecture and component documentation |
| [docs/TAXONOMY_SYSTEM.md](docs/TAXONOMY_SYSTEM.md) | Taxonomy system and learning pathways |

### Quick Links

- [Question Structure](docs/MODELS.md#question) — JSON schema for question config_data
- [Exercise Spec](docs/MODELS.md#exercise) — JSON schema for exercise selection rules
- [Taxonomy Hierarchy](docs/TAXONOMY_SYSTEM.md) — Four-level curriculum structure
- [User Roles](docs/AUTHENTICATION.md#user-roles) — RBAC permission matrix
- [API Endpoints](docs/API.md) — RESTful API reference

## CI/CD

GitHub Actions runs on every push/PR:

- **RuboCop** — Ruby linting
- **ESLint** — JavaScript/TypeScript linting
- **Rails test suite** — Full test suite with PostgreSQL service container

## Future Roadmap

- **Article Module** — MDX-based article rendering
- **Macro Organisation** — Attach articles to exercises and tags, organise articles into topics and course flows
- **Enhanced Reporting** — Keep track of progress over time with more detailed analytics
- **Collaborative Features** — Shared workspaces, peer review, and instructor feedback

---

## Key Improvements Over Original

elearn-ngx (the "ngx" stands for "now good xtreme") improves on the original in several key ways:

- **Better MCQ Experience** — Real LaTeX/MathJax rendering in questions and answers
- **Smarter Exercise Randomisation** — Full control over how exercises are built: pick specific static questions, randomly select from tag branches, or mix both approaches
- **Tag Organisation** — Organise questions into hierarchical tags (e.g., Microeconomics → Supply & Demand → Elasticity) for easy browsing and targeted practice
- **Good Question Editor** — Write questions with Markdown support, preview LaTeX in real-time, and manage multiple choice options with ease. Add hints and answer rationale
- **Comprehensive Analytics** — Student dashboards, instructor analytics, cohort metrics, and topic-based performance tracking
- **Learning Pathways** — Structured curriculum with gamified progress tracking
- **Practice Exercises** — Auto-generated exercises that target weak areas based on performance history

---

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards

- Follow Ruby on Rails conventions
- Write tests for new features
- Maintain documentation in `docs/` directory
- Ensure all tests pass before submitting PR

## License

This project is licensed under MIT.

## Support

For issues and feature requests, please use the GitHub issue tracker.
