import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import React from 'react';

// Mock BEFORE imports
let mockGetScore: () => number | null = () => null;
let mockGetSerializedState: () => Record<string, unknown> | null = () => null;

interface MockChoice {
  content: string;
  correct: boolean;
}

interface MockProps {
  question: string;
  choices?: MockChoice[];
}

vi.mock('../perseus/MultiChoice', () => ({
  MultiChoice: React.forwardRef(({ question, choices }: MockProps, ref: React.Ref<{ getScore: () => number | null }>) => {
    React.useImperativeHandle(ref, () => ({
      getScore: mockGetScore,
      getSerializedState: mockGetSerializedState,
      setSerializedState: () => { },
    }));
    return React.createElement('div', { 'data-testid': 'mock-question' },
      React.createElement('p', null, question),
      choices?.map((c, i) => React.createElement('span', { key: i }, c.content))
    );
  }),
}));

vi.mock('../perseus/PerseusRenderer', () => ({
  PerseusRenderer: () => React.createElement('div', null, 'Mock Renderer'),
  dependencies: {},
}));

vi.mock('@khanacademy/perseus', () => ({
  ServerItemRenderer: () => null,
  PerseusDependencies: {},
}));

vi.mock('@khanacademy/perseus-core', () => ({
  scorePerseusItem: () => ({ type: 'points', earned: 1, total: 1 }),
}));

vi.mock('../perseus/Markdown', () => ({
  default: ({ children }: { children: React.ReactNode }) => React.createElement('span', null, children),
}));

vi.mock('../perseus/TeX', () => ({
  TeX: ({ children }: { children: React.ReactNode }) => React.createElement('span', null, children),
}));

// Import after mocks
import InteractivePlayer from '../islands/interactive-player';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockExerciseData = {
  title: 'Test Exercise',
  questions: [
    {
      uuid: 'q-1',
      content: 'What is 2 + 2?',
      options: [
        { content: '3', correct: false },
        { content: '4', correct: true },
      ],
      hints: ['Count the numbers'],
    },
    {
      uuid: 'q-2',
      content: 'Solve for x: 2x = 10',
      options: [
        { content: '2', correct: false },
        { content: '5', correct: true },
      ],
      hints: [],
    },
    {
      uuid: 'q-3',
      content: 'What is the capital of France?',
      options: [
        { content: 'London', correct: false },
        { content: 'Paris', correct: true },
      ],
      hints: [],
    },
  ],
};

describe('InteractivePlayer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockExerciseData),
    });
    mockGetScore = () => null;
    mockGetSerializedState = () => null;
  });

  it('shows loading state initially', () => {
    render(React.createElement(InteractivePlayer, { exerciseId: 'ex-1', title: 'Test Exercise' }));
    expect(screen.getByText('Loading exercise...')).toBeInTheDocument();
  });

  it('displays question 1 of 3 on initial render', async () => {
    render(React.createElement(InteractivePlayer, { exerciseId: 'ex-1', title: 'Test Exercise' }));

    await waitFor(() => {
      expect(screen.getByText('Question 1 of 3')).toBeInTheDocument();
      expect(screen.getByText('Progress: 33%')).toBeInTheDocument();
    });
  });

  it('advances to next question when Next is clicked', async () => {
    render(React.createElement(InteractivePlayer, { exerciseId: 'ex-1', title: 'Test Exercise' }));

    await waitFor(() => {
      expect(screen.getByText('Question 1 of 3')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(screen.getByText('Question 2 of 3')).toBeInTheDocument();
      expect(screen.getByText('Progress: 67%')).toBeInTheDocument();
    });
  });

  it('shows Submit All Answers button on last question', async () => {
    render(React.createElement(InteractivePlayer, { exerciseId: 'ex-1', title: 'Test Exercise' }));

    await waitFor(() => {
      expect(screen.getByText('Question 1 of 3')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Next'));
    await waitFor(() => {
      expect(screen.getByText('Question 2 of 3')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(screen.getByText('Question 3 of 3')).toBeInTheDocument();
      expect(screen.getByText('Submit All Answers')).toBeInTheDocument();
    });
  });

  it('enables Back button after navigating forward', async () => {
    render(React.createElement(InteractivePlayer, { exerciseId: 'ex-1', title: 'Test Exercise' }));

    await waitFor(() => {
      expect(screen.getByText('Question 1 of 3')).toBeInTheDocument();
    });

    // Back button should not be visible on first question
    expect(screen.queryByText('Back')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(screen.getByText('Back')).toBeInTheDocument();
    });
  });

  it('displays empty state when no questions returned', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ title: 'Empty', questions: [] }),
    });

    render(React.createElement(InteractivePlayer, { exerciseId: 'ex-empty', title: 'Empty Exercise' }));

    await waitFor(() => {
      expect(screen.getByText('No questions available for this exercise.')).toBeInTheDocument();
    });
  });

  it('shows all questions after submitting', async () => {
    mockGetScore = () => 1;

    render(React.createElement(InteractivePlayer, { exerciseId: 'ex-1', title: 'Test Exercise' }));

    await waitFor(() => {
      expect(screen.getByText('Question 1 of 3')).toBeInTheDocument();
    });

    // Navigate to last question and submit
    fireEvent.click(screen.getByText('Next'));
    await waitFor(() => {
      expect(screen.getByText('Question 2 of 3')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Next'));
    await waitFor(() => {
      expect(screen.getByText('Question 3 of 3')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Submit All Answers'));

    await waitFor(() => {
      expect(screen.getByText('Exercise Complete!')).toBeInTheDocument();
      // All question numbers should be visible
      expect(screen.getByText('Question 1')).toBeInTheDocument();
      expect(screen.getByText('Question 2')).toBeInTheDocument();
      expect(screen.getByText('Question 3')).toBeInTheDocument();
    });
  });

  it('shows results after submitting all answers', async () => {
    mockGetScore = () => 1;

    render(React.createElement(InteractivePlayer, { exerciseId: 'ex-1', title: 'Test Exercise' }));

    await waitFor(() => {
      expect(screen.getByText('Question 1 of 3')).toBeInTheDocument();
    });

    // Navigate to last question and submit
    fireEvent.click(screen.getByText('Next'));
    await waitFor(() => {
      expect(screen.getByText('Question 2 of 3')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Next'));
    await waitFor(() => {
      expect(screen.getByText('Question 3 of 3')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Submit All Answers'));

    await waitFor(() => {
      expect(screen.getByText('Exercise Complete!')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('3 out of 3 correct')).toBeInTheDocument();
    });
  });

  it('shows correct/incorrect chips for each question after submit', async () => {
    mockGetScore = () => 1;

    render(React.createElement(InteractivePlayer, { exerciseId: 'ex-1', title: 'Test Exercise' }));

    await waitFor(() => {
      expect(screen.getByText('Question 1 of 3')).toBeInTheDocument();
    });

    // Navigate to last question and submit
    fireEvent.click(screen.getByText('Next'));
    await waitFor(() => {
      expect(screen.getByText('Question 2 of 3')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Next'));
    await waitFor(() => {
      expect(screen.getByText('Question 3 of 3')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Submit All Answers'));

    await waitFor(() => {
      const correctChips = screen.getAllByText('Correct');
      expect(correctChips.length).toBe(3);
    });
  });

  it('shows Try Again button after submitting', async () => {
    mockGetScore = () => 1;

    render(React.createElement(InteractivePlayer, { exerciseId: 'ex-1', title: 'Test Exercise' }));

    await waitFor(() => {
      expect(screen.getByText('Question 1 of 3')).toBeInTheDocument();
    });

    // Navigate to last question and submit
    fireEvent.click(screen.getByText('Next'));
    await waitFor(() => {
      expect(screen.getByText('Question 2 of 3')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Next'));
    await waitFor(() => {
      expect(screen.getByText('Question 3 of 3')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Submit All Answers'));

    await waitFor(() => {
      expect(screen.getByText('Try Again')).toBeInTheDocument();
      expect(screen.getByText('Back to Exercises')).toBeInTheDocument();
    });
  });

  it('navigates back to previous question', async () => {
    render(React.createElement(InteractivePlayer, { exerciseId: 'ex-1', title: 'Test Exercise' }));

    await waitFor(() => {
      expect(screen.getByText('Question 1 of 3')).toBeInTheDocument();
    });

    // Navigate forward
    fireEvent.click(screen.getByText('Next'));
    await waitFor(() => {
      expect(screen.getByText('Question 2 of 3')).toBeInTheDocument();
    });

    // Navigate back
    fireEvent.click(screen.getByText('Back'));
    await waitFor(() => {
      expect(screen.getByText('Question 1 of 3')).toBeInTheDocument();
      expect(screen.getByText('Progress: 33%')).toBeInTheDocument();
    });
  });
});
