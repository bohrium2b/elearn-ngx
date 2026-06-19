import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import { CourseAssembler } from '../taxonomy/admin/CourseAssembler';
import { workspaceLightTheme } from '../../entrypoints/theme';

const CourseAssemblerIsland = () => {
  return (
    <ThemeProvider theme={workspaceLightTheme}>
      <CourseAssembler />
    </ThemeProvider>
  );
};

// Register as custom element
export const tagName = 'course-assembler';

if (!customElements.get(tagName)) {
  class CourseAssemblerElement extends HTMLElement {
    private root: ReturnType<typeof createRoot> | null = null;

    connectedCallback() {
      this.root = createRoot(this);
      this.root.render(<CourseAssemblerIsland />);
    }

    disconnectedCallback() {
      this.root?.unmount();
    }
  }

  customElements.define(tagName, CourseAssemblerElement);
}

export default CourseAssemblerIsland;
