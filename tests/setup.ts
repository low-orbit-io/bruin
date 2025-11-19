import '@testing-library/jest-dom/vitest';

// Import and setup React act for testing
// React 19 CJS builds have issues with act not being properly available
import { act } from 'react';
import * as React from 'react';

// Ensure act is available on React for all module formats
if (typeof (React as any).act !== 'function') {
  (React as any).act = act;
}

// Make act available globally for testing libraries
if (typeof globalThis !== 'undefined') {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  if (!(globalThis as any).React) {
    (globalThis as any).React = React;
  }
  // Ensure global act is available
  if (!(globalThis as any).act) {
    (globalThis as any).act = act;
  }
}
