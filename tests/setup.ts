import * as React from 'react';
import { act } from 'react';

// Ensure React.act is available for React Testing Library
if (typeof React.act !== 'function') {
  try {
    (React as any).act = act;
  } catch {
    // React.act may be non-configurable in some React versions
  }
}
(globalThis as any).React = React;

if (typeof require !== 'undefined') {
  const Module = require('module') as typeof import('module');
  const originalRequire = Module.prototype.require;

  Module.prototype.require = function (
    this: typeof Module.prototype,
    id: string,
  ) {
    const module = originalRequire.apply(this, [id] as any);

    if (id === 'react' && module) {
      try {
        if (typeof module.act !== 'function') {
          module.act = act;
        }
      } catch {
        // module.act may be non-configurable
      }

      try {
        if (module.default && typeof module.default.act !== 'function') {
          module.default.act = act;
        }
      } catch {
        // module.default.act may be non-configurable
      }
    }

    return module;
  } as typeof Module.prototype.require;

  const reactModule = require('react');

  try {
    if (typeof reactModule.act !== 'function') {
      reactModule.act = act;
    }
  } catch {
    // reactModule.act may be non-configurable
  }

  try {
    if (reactModule.default && typeof reactModule.default.act !== 'function') {
      reactModule.default.act = act;
    }
  } catch {
    // reactModule.default.act may be non-configurable
  }

  try {
    const reactDomTestUtils = require('react-dom/test-utils');
    if (reactDomTestUtils && typeof reactDomTestUtils.act !== 'function') {
      reactDomTestUtils.act = act;
    }
  } catch {
    // react-dom/test-utils might not be available in all environments
  }
}

import '@testing-library/jest-dom/vitest';
