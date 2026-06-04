# AGENTS.md - elearn-ngx

This document provides essential information for AI agents working on the elearn-ngx project.

## Project Overview

**elearn-ngx** is an interactive economics learning platform built with:
- **Backend:** Ruby on Rails 7.2 with PostgreSQL
- **Frontend:** React 18 "islands" architecture with MUI components
- **Build Tool:** Vite for frontend bundling
- **Key Libraries:** Khan Academy Perseus (interactive exercises), MathJax/KaTeX (math rendering)

## Directory Structure

```
/workspaces/elearn-ngx/
├── app/
│   ├── controllers/       # Rails controllers (Questions, Exercises, Tags, Workspace)
│   ├── models/            # ActiveRecord models (Question, Exercise, Tag)
│   ├── services/          # Service objects (ExerciseResolver)
│   ├── views/             # ERB templates for server-rendered pages
│   └── frontend/          # React frontend code
│       ├── components/    # React components
│       │   ├── islands/   # Web components (islands architecture)
│       │   ├── workspace/ # Workspace-specific components
│       │   ├── exercises/ # Exercise-related components
│       │   └── perseus/   # Perseus renderer components
│       └── entrypoints/   # Vite entry points
├── config/                # Rails configuration
├── db/                    # Database migrations and schema
└── test/                  # Test files
```

## Key Models

### Question
- Stores questions with `config_data` JSON field containing:
  - `question`: Question text (Markdown supported)
  - `choices`: Array of answer choices with `content`, `correct`, `rationale`
  - `hints`: Array of hint strings
  - `numChoices`: Number of correct choices
  - `type`: Question type (e.g., "multi-choice")
- Has UUID and slug for URL-friendly identifiers
- Many-to-many relationship with Tags

### Tag
- Hierarchical structure with parent/child relationships
- Fields: `name`, `slug`, `uuid`, `color`
- Validates against circular parent references
- Methods: `all_descendants`, `total_questions_in_branch`, `is_ancestor_of?`

### Exercise
- Contains `spec` JSON field with `selection_rules` array
- Selection rules types:
  - `dynamic_tag`: Randomly select N questions from a tag branch
  - `static_question`: Include a specific question by UUID
- Validates spec structure and prevents over-selection

## Key Controllers

### QuestionsController
- RESTful actions: `index`, `show`, `new`, `edit`, `create`, `update`, `destroy`
- Supports both HTML and JSON responses
- Uses `find_question_by_param` to find by UUID, slug, or ID
- Validates question config structure before save

### ExercisesController
- RESTful actions plus `start` action
- `start` action uses `ExerciseResolver` to resolve questions from spec

### TagController
- Full CRUD for tags
- `index` returns full tag tree with nested questions
- Uses `find_tag_by_param` for UUID/slug/ID lookup

### WorkspaceController
- Main dashboard (`show` action)
- Returns tree structure of tags with nested questions
- Includes untagged questions

## Frontend Architecture

### Islands Pattern
React components are mounted as web components on server-rendered pages:
- Components in `app/frontend/components/islands/` are registered as custom elements
- Each island component exports a `tagName` (e.g., `workspace-dashboard`)

### Key Components
- **WorkspaceDashboard**: Main drag-and-drop interface for organizing questions
- **InteractivePlayer**: Renders exercises using Perseus
- **QuestionRenderer**: Displays individual questions
- **MultiChoiceEditor**: Editor for multi-choice questions

### Entry Points
- `application.ts`: Loaded on every page, initializes Turbo and Stimulus
- `theme.tsx`: Theme-related code
- `web_components.ts`: Registers React components as web components

## Service Objects

### ExerciseResolver
- Resolves exercise specifications into actual questions
- Handles both `dynamic_tag` and `static_question` selection rules
- Prevents duplicate questions across rules
- Returns plain text data structure for frontend consumption

## URL Patterns

- Questions: `/questions/:id` where ID format is `uuid-x:slug`
- Tags: `/tag/:id` where ID format is `uuid-x:slug`
- Exercises: `/exercises/:id`
- Exercise start: `/exercises/:id/start`
- Workspace: `/` (root)

## Development Commands

```bash
# Start Rails server
bin/rails server

# Start Vite dev server (HMR)
yarn dev

# Ruby linting
bundle exec rubocop

# TypeScript type-check
yarn tsc --noEmit

# ESLint
yarn lint

# Run Rails tests
bundle exec rails test
```

## Code Conventions

### Ruby/Rails
- Use frozen string literals in service objects
- Service objects go in `app/services/`
- Use `respond_to` blocks for multi-format responses
- Validate with custom methods in models

### TypeScript/React
- Use functional components with hooks
- Export types from dedicated `types.ts` files
- Use `@/` alias for imports (maps to `app/frontend/`)
- Islands export `tagName` for web component registration

### Database
- Use UUIDs for public-facing identifiers
- Use slugs for URL-friendly names
- Store flexible data in JSON columns (`config_data`, `spec`)

## Common Patterns

### Finding by Param Pattern
Both Questions and Tags use a pattern to find records by:
1. UUID (first 36 chars of param)
2. Slug
3. Database ID (fallback)

### Serialization Pattern
Controllers have private `serialize_*` methods to convert models to JSON with:
- Public identifiers (uuid, slug)
- Config data extraction
- Path generation for frontend links

### Validation Pattern
Models use custom validation methods with descriptive error messages:
- `spec_structure` for Exercise
- `parent_must_not_create_cycle` for Tag
- `ensure_valid_question_structure` for Question (stub)

## Environment Variables

Configure in `.env` file (copy from `.env.example`):
- PostgreSQL credentials
- Other environment-specific settings

## Testing

- Rails tests: Minitest with Capybara for integration tests
- Frontend tests: Vitest with React Testing Library
- Factory Bot for test data
- Faker for generating fake data

## Important Notes

- MathJax v4 is used (not v3)
- jQuery is included for Perseus compatibility
- Bootstrap 5 CSS is loaded globally
- Turbo Drive is enabled for SPA-like navigation
- Stimulus controllers auto-load from `app/frontend/controllers/`
