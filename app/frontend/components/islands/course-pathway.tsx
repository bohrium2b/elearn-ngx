/**
 * course-pathway.tsx – Island component for the gamified learning pathway view
 *
 * Registers <course-pathway> as a custom element that renders the
 * LinearPathway component with gamification elements (streak, gems, hearts,
 * progress tracking, animated topic nodes).
 *
 * Expected data-props: { courseId: string }
 */

import React from "react";
import { LinearPathway } from "../taxonomy/LinearPathway";

// ── Island tag name (must contain a hyphen per the Custom Elements spec) ──────
export const tagName = "course-pathway";

// ── Props interface ───────────────────────────────────────────────────────────
interface CoursePathwayProps {
  courseId?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function CoursePathway({ courseId = "" }: CoursePathwayProps) {
  if (!courseId) {
    return (
      <div style={{ padding: "1rem", color: "red" }}>
        Error: courseId prop is required
      </div>
    );
  }

  return <LinearPathway courseId={courseId} />;
}
