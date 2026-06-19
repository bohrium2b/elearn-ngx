# Frontend Architecture Documentation

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Entry Points](#entry-points)
- [Islands Components](#islands-components)
- [Perseus Components](#perseus-components)
- [Workspace Components](#workspace-components)
- [Taxonomy Components](#taxonomy-components)
- [Analytics Components](#analytics-components)
- [Build System](#build-system)
- [State Management](#state-management)
- [Styling](#styling)

## Overview

The elearn-ngx frontend uses an "islands" architecture where React components are mounted as web components on server-rendered pages. This approach allows for progressive enhancement while maintaining SEO benefits and fast initial page loads.

**Key Technologies:**
- React 18 with functional components and hooks
- TypeScript for type safety
- MUI (Material UI) components for consistent UI
- Vite for fast development and optimized builds
- Khan Academy Perseus for interactive exercises
- MathJax v4 for math rendering

---

## Architecture

### Islands Pattern

React components are registered as custom elements (web components) and can be embedded in server-rendered HTML:

```html
<workspace-dashboard></workspace-dashboard>
<course-library></course-library>
<interactive-player exercise-uuid="..."></interactive-player>
```

**Benefits:**
- Progressive enhancement
- SEO-friendly server-rendered pages
- Independent component loading
- Framework-agnostic embedding

### Component Organization

```
app/frontend/
├── components/
│   ├── islands/          # Web components (custom elements)
│   ├── perseus/          # Perseus renderer components
│   ├── workspace/        # Workspace-specific components
│   ├── taxonomy/         # Taxonomy browsing components
│   ├── analytics/        # Analytics types
│   └── __tests__/        # Component tests
├── context/              # React context providers
├── entrypoints/          # Vite entry points
└── shims/                # Compatibility shims
```

---

## Entry Points

### application.ts
Loaded on every page. Initializes:
- Turbo (SPA-like navigation)
- Stimulus controllers
- Global event handlers

### theme.tsx
Theme-related code and MUI theme configuration.

### web_components.ts
Registers React components as web components:

```typescript
import { defineCustomElement } from '@/utils/web-component-utils';

// Register islands
defineCustomElement('workspace-dashboard', WorkspaceDashboard);
defineCustomElement('course-library', CourseLibrary);
defineCustomElement('interactive-player', InteractivePlayer);
// ... more components
```

---

## Islands Components

Islands are web components that can be embedded in any HTML page.

### WorkspaceDashboard
**Tag:** `<workspace-dashboard>`

Main drag-and-drop interface for organizing questions.

**Features:**
- Hierarchical tag tree navigation
- Question cards with drag-and-drop
- Inline question editing
- Untagged questions section

### CourseLibrary
**Tag:** `<course-library>`

Hierarchical browser for courses.

**Features:**
- Course/Part/Unit/Topic navigation
- Collapsible tree structure
- Question count indicators
- Quick access to exercises

### CoursePathway
**Tag:** `<course-pathway>`

Gamified linear pathway view.

**Features:**
- Vertical scrolling path
- Progress indicators
- Topic completion status
- Gamification elements

### CourseAssembler
**Tag:** `<course-assembler>`

Admin drag-and-drop dashboard for course creation.

**Features:**
- Split-pane layout (inventory, canvas, preview)
- Drag-and-drop question assignment
- Topic management
- Real-time preview

### InteractivePlayer
**Tag:** `<interactive-player>`

Renders exercises using Perseus.

**Props:**
- `exercise-uuid` - Exercise identifier

**Features:**
- Multi-choice question rendering
- Hint system
- Progress tracking
- Score calculation

### QuestionRenderer
**Tag:** `<question-renderer>`

Displays individual questions.

**Features:**
- Markdown rendering
- MathJax support
- Choice selection
- Correct/incorrect feedback

### MultiChoiceEditor
**Tag:** `<multi-choice-editor>`

Editor for multi-choice questions.

**Features:**
- Add/remove choices
- Mark correct answers
- Add rationales
- Add hints

### SessionReview
**Tag:** `<session-review>`

Review past assessment sessions.

**Features:**
- Question-by-question review
- Correct answer display
- Rationale explanation
- Tag and topic breakdown

### StudentAnalytics
**Tag:** `<student-analytics>`

Student-facing analytics dashboard.

**Features:**
- Performance summary
- Weak points display
- Recommendations
- Progress charts

### EducatorDashboard
**Tag:** `<educator-dashboard>`

Instructor analytics dashboard.

**Features:**
- Cohort overview
- Student performance
- Tag performance matrix
- Item discrimination

### TagShow
**Tag:** `<tag-show>`

Tag detail view.

**Features:**
- Tag information
- Associated questions
- Child tags
- Question count

### AppNavigation
**Tag:** `<app-navigation>`

Application navigation bar.

**Features:**
- User menu
- Role-based navigation
- Search functionality

### BasicMarkdown
**Tag:** `<basic-markdown>`

Markdown rendering component.

**Features:**
- Markdown to HTML
- Code highlighting
- MathJax integration

### Button
**Tag:** `<button>`

Styled button component.

**Variants:**
- Primary
- Secondary
- Danger
- Ghost

### HelloIsland
**Tag:** `<hello-island>`

Example/test island component.

---

## Perseus Components

Components for rendering Khan Academy Perseus-style interactive exercises.

### PerseusRenderer
Main renderer for Perseus content.

**Features:**
- Widget rendering
- Interactive elements
- Scoring logic

### MultiChoice
Multi-choice question renderer.

**Features:**
- Single/multiple correct answers
- Choice shuffling
- Visual feedback

### MultiChoiceEditor
Editor for creating multi-choice questions.

**Features:**
- Dynamic choice management
- Correct answer selection
- Rationale input

### QuestionCard
Card display for questions.

**Features:**
- Question text
- Choices
- Hints toggle
- Correct/incorrect indicators

### QuestionRenderer
Renders question content.

**Features:**
- Markdown support
- Math rendering
- Interactive widgets

### Markdown
Markdown rendering component.

**Features:**
- GitHub-flavored markdown
- Syntax highlighting
- MathJax integration

### TeX
TeX math rendering component.

**Features:**
- Inline math: `$...$`
- Display math: `$$...$$`
- MathJax v4 integration

### MathJax Loader
Loads and configures MathJax v4.

**Features:**
- Lazy loading
- TeX input
- SVG output
- Accessibility support

---

## Workspace Components

Components for the question management workspace.

### WorkspaceDashboard
Main workspace component.

**Features:**
- Tag tree sidebar
- Question grid
- Drag-and-drop
- Search and filter

### SidebarNode
Tree node in the sidebar.

**Features:**
- Expand/collapse
- Question count
- Color indicator
- Drag handle

### QuestionCard
Card displaying a question.

**Features:**
- Question preview
- Tag indicators
- Edit button
- Drag handle

### AddQuestionCard
Card for adding new questions.

**Features:**
- Quick add form
- Tag selection
- Inline editing

### SubtagCard
Card for subtag navigation.

**Features:**
- Tag name
- Question count
- Expand/collapse

### QuestionDetailPanel
Side panel for question details.

**Features:**
- Full question display
- Edit form
- Tag management
- Delete option

### EmptyState
Empty state placeholder.

**Features:**
- Helpful message
- Action button
- Illustration

---

## Taxonomy Components

Components for browsing and managing the taxonomy.

### LibraryBrowser
Hierarchical browser for taxonomy.

**Features:**
- Course/Part/Unit/Topic tree
- Collapsible nodes
- Question counts
- Quick navigation

### LinearPathway
Linear pathway view.

**Features:**
- Vertical scrolling
- Progress indicators
- Topic cards
- Completion status

### CourseCard
Card displaying a course.

**Features:**
- Course name
- Description
- Part count
- Topic count
- Question count

### TopicNode
Topic node in the tree.

**Features:**
- Topic name
- Question count
- Tags
- Exercises

### TaxonomyFolderView
Folder-style taxonomy view.

**Features:**
- Nested folders
- Question counts
- Expand/collapse

### Admin Components

#### CourseAssembler
Admin course assembly interface.

**Features:**
- Drag-and-drop
- Inventory panel
- Canvas
- Preview panel

#### InventoryPanel
Panel showing available questions.

**Features:**
- Search
- Filter by tag
- Drag source

#### PathwayCanvas
Canvas for building pathways.

**Features:**
- Drop target
- Topic ordering
- Question assignment

#### PreviewPanel
Preview of assembled course.

**Features:**
- Live preview
- Navigation test
- Question count

---

## Analytics Components

### Types
TypeScript types for analytics data.

```typescript
interface DashboardSummary {
  total_sessions: number;
  average_score: number;
  recent_sessions_count: number;
  recent_average_score: number;
  weekly_sessions_count: number;
  weekly_average_score: number;
  total_questions_answered: number;
  total_correct: number;
  current_streak: number;
}

interface WeakPoint {
  question_uuid: string;
  attempts: number;
  correct: number;
  success_rate: number;
  last_attempt: string;
  tags: string[];
}

interface Recommendation {
  type: string;
  title: string;
  description: string;
  tags: { name: string; uuid: string }[];
  exercise_path: string;
}
```

---

## Build System

### Vite Configuration

**Development:**
```bash
yarn dev
```
- Hot Module Replacement (HMR)
- Fast refresh
- Source maps

**Production:**
```bash
yarn build
```
- Optimized bundles
- Code splitting
- Tree shaking
- Minification

### TypeScript Configuration

- Strict mode enabled
- Path aliases (`@/` maps to `app/frontend/`)
- JSX: react-jsx
- Module resolution: ES modules

### Linting

```bash
yarn lint
```
- ESLint with TypeScript support
- React hooks rules
- Import ordering

---

## State Management

### React Context

**ThemeContext:**
```typescript
const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  toggleMode: () => {},
});
```

**Usage:**
```typescript
const { mode, toggleMode } = useContext(ThemeContext);
```

### Local Component State

Components use React hooks for local state:

```typescript
const [questions, setQuestions] = useState<Question[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
```

### Data Fetching

```typescript
useEffect(() => {
  const fetchData = async () => {
    try {
      const response = await fetch('/api/assessment_sessions');
      const data = await response.json();
      setSessions(data.sessions);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);
```

---

## Styling

### MUI Theme

Custom MUI theme with:

```typescript
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});
```

### CSS Modules

Components use CSS modules for scoped styles:

```typescript
import styles from './Component.module.css';

<div className={styles.container}>
  <h1 className={styles.title}>Title</h1>
</div>
```

### Global Styles

- Bootstrap 5 CSS loaded globally
- Custom CSS variables for theming
- Perseus-specific styles

### MathJax Styles

```css
.mathjax-container {
  overflow-x: auto;
  padding: 1rem 0;
}

.mjx-container {
  display: inline-block;
}
```

---

## Testing

### Component Tests

```typescript
import { render, screen } from '@testing-library/react';
import { QuestionCard } from './QuestionCard';

test('renders question text', () => {
  const question = { id: 1, question: 'Test question' };
  render(<QuestionCard question={question} />);
  expect(screen.getByText('Test question')).toBeInTheDocument();
});
```

### Test Files

- `components/__tests__/ExerciseBuilder.test.tsx`
- `components/__tests__/InteractivePlayer.test.tsx`

---

## Best Practices

### Component Structure

```typescript
interface Props {
  // Define props interface
}

export const Component: React.FC<Props> = ({ prop1, prop2 }) => {
  // Hooks at the top
  const [state, setState] = useState(initialState);
  
  // Effects
  useEffect(() => {
    // Side effects
  }, [dependencies]);
  
  // Event handlers
  const handleClick = () => {
    // Handle click
  };
  
  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
};

export default Component;
```

### Performance

- Use `React.memo` for expensive components
- Use `useCallback` for event handlers passed to children
- Use `useMemo` for expensive calculations
- Lazy load heavy components with `React.lazy`

### Accessibility

- Use semantic HTML
- Add ARIA labels
- Ensure keyboard navigation
- Test with screen readers

---

## Deployment

### Asset Compilation

```bash
yarn build
```

Outputs to `public/assets/` with fingerprinted filenames.

### CDN Integration

Configure CDN URL in production:

```ruby
# config/environments/production.rb
config.asset_host = 'https://cdn.example.com'
```

### Cache Headers

Static assets are served with long cache headers due to fingerprinting.
