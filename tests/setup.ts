import '@testing-library/jest-dom/vitest';

// Import and setup React act for testing
// React 19 CJS builds have issues with act not being properly available
import { act } from 'react';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

// Ensure act is available on both React and ReactDOM for all module formats
if (typeof (React as any).act !== 'function') {
  (React as any).act = act;
}

if (typeof (ReactDOM as any).act !== 'function') {
  (ReactDOM as any).act = act;
}

// Also make act available globally for testing libraries
if (typeof globalThis !== 'undefined') {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  if (!(globalThis as any).React) {
    (globalThis as any).React = React;
  }
}
