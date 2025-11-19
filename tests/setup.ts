import '@testing-library/jest-dom/vitest';

// Import and setup React act for testing
// React 19 CJS builds have issues with act not being properly available
import { act } from 'react';
import * as React from 'react';

// Ensure act is available on React for all module formats
if (typeof (React as any).act !== 'function') {
  try {
    Object.defineProperty(React, 'act', {
      value: act,
      writable: true,
      configurable: true,
    });
  } catch {
    // If defineProperty fails, fallback to direct assignment
    (React as any).act = act;
  }
}

// Make act available globally for testing libraries
if (typeof globalThis !== 'undefined') {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  if (!(globalThis as any).React) {
    (globalThis as any).React = React;
  }
  if (!(globalThis as any).act) {
    (globalThis as any).act = act;
  }
}
