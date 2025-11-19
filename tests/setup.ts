// Set React act environment flag FIRST, before any imports
if (typeof globalThis !== 'undefined') {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
}

import { act } from 'react';
import * as React from 'react';
import '@testing-library/jest-dom/vitest';

// Patch require BEFORE importing anything that might use React
if (typeof require !== 'undefined') {
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

    // Patch react-dom/test-utils when required - this is critical for production builds
    if (
      (id === 'react-dom/test-utils' || id.includes('react-dom-test-utils')) &&
      module
    ) {
      module.act = act;
    }

    return module;
  } as typeof Module.prototype.require;

  // Pre-patch React if already loaded
  try {
    const reactModule = require('react');
    if (reactModule && typeof reactModule.act !== 'function') {
      reactModule.act = act;
    }
  } catch {
    // Not available
  }
}

// Ensure React.act is available
try {
  (React as any).act = act;
} catch {
  // May be non-configurable in some React versions
}
(globalThis as any).React = React;
