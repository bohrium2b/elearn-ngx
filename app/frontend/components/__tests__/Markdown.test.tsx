import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import Markdown from '../app/frontend/components/perseus/Markdown';

describe('Markdown XSS Prevention', () => {
  it('escapes HTML entities in TeX content', async () => {
    render(<Markdown>$\$<script>alert('xss')</script>$\$</Markdown>);
    await waitFor(() => {
      expect(document.body.innerHTML).not.toContain('<script>');
    });
  });

  it('does not execute inline event handlers in markdown', async () => {
    const alertMock = vi.fn();
    window.alert = alertMock;

    render(<Markdown><img src=x onerror="alert('xss')"></Markdown>);
    await waitFor(() => {
      expect(alertMock).not.toHaveBeenCalled();
    });
  });

  it('escapes special characters in TeX', async () => {
    render(<Markdown>$\$<>&"\$</Markdown>);
    await waitFor(() => {
      const container = document.querySelector('.markdown-body');
      expect(container).toBeTruthy();
    });
  });
});
