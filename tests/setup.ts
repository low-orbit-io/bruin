// Set React act environment flag FIRST, before any imports
if (typeof globalThis !== 'undefined') {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
}

import { act } from 'react';
import * as React from 'react';
import '@testing-library/jest-dom/vitest';

// Ensure React.act is available globally
if (typeof React !== 'undefined' && typeof (React as any).act !== 'function') {
  (React as any).act = act;
}

// Make React available globally
if (typeof globalThis !== 'undefined') {
  (globalThis as any).React = React;
}

// For environments with require (Node.js)
if (typeof require !== 'undefined') {
  try {
    const Module = require('module') as typeof import('module');
    const originalRequire = Module.prototype.require;

    Module.prototype.require = function (
      this: typeof Module.prototype,
      id: string,
    ) {
      const module = originalRequire.apply(this, [id] as any);

      // Patch React when required
      if (id === 'react' && module && typeof module.act !== 'function') {
        module.act = act;
      }

      // Patch react-dom/test-utils when required
      if (
        (id === 'react-dom/test-utils' ||
          id.includes('react-dom-test-utils')) &&
        module
      ) {
        module.act = act;
      }

      return module;
    } as typeof Module.prototype.require;

    // Pre-patch React if already loaded
    const reactModule = require('react');
    if (reactModule && typeof reactModule.act !== 'function') {
      reactModule.act = act;
    }
  } catch {
    // Silently fail if module system is not available
  }
}
