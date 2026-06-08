/**
 * course-library.tsx – Island component for the course library browser
 *
 * Registers <course-library> as a custom element that renders the
 * LibraryBrowser component for browsing the taxonomy hierarchy.
 */

import React from 'react';
import { LibraryBrowser } from '../taxonomy/LibraryBrowser';
import { Topic } from '../taxonomy/types';

// ── Island tag name (must contain a hyphen per the Custom Elements spec) ──────
export const tagName = 'course-library';

// ── Props interface ───────────────────────────────────────────────────────────
interface CourseLibraryProps {
  // No props needed - component fetches its own data
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function CourseLibrary(_props: CourseLibraryProps) {
  const handleTopicSelect = (topic: Topic) => {
    // Navigate to topic or open in player
    window.location.href = `/taxonomy/${topic.path_identifier}`;
  };

  return <LibraryBrowser onTopicSelect={handleTopicSelect} />;
}
