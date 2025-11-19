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
  // Patch React immediately in require cache before any other modules load
  if (require.cache) {
    for (const key in require.cache) {
      const cached = require.cache[key];
      if (
        cached &&
        cached.exports &&
        cached.id &&
        cached.id.includes('react') &&
        !cached.id.includes('react-dom')
      ) {
        try {
          if (cached.exports && typeof cached.exports.act !== 'function') {
            cached.exports.act = act;
          }
          if (
            cached.exports.default &&
            typeof cached.exports.default.act !== 'function'
          ) {
            cached.exports.default.act = act;
          }
        } catch {
          // exports.act may be non-configurable
        }
      }
    }
  }
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

      // Patch require cache to ensure React has act before react-dom/test-utils loads
      if (require.cache) {
        const cacheKey = Object.keys(require.cache).find(
          (key) => require.cache[key]?.exports === module,
        );
        if (cacheKey && require.cache[cacheKey]?.exports) {
          try {
            const cachedExports = require.cache[cacheKey]?.exports;
            if (cachedExports && typeof cachedExports.act !== 'function') {
              cachedExports.act = act;
            }
          } catch {
            // exports.act may be non-configurable
          }
        }
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

  // Patch require cache for React module
  if (require.cache) {
    for (const key in require.cache) {
      const cached = require.cache[key];
      if (
        cached &&
        cached.exports &&
        (cached.exports === reactModule ||
          cached.exports.default === reactModule ||
          (cached.id &&
            cached.id.includes('react') &&
            !cached.id.includes('react-dom')))
      ) {
        try {
          if (cached.exports && typeof cached.exports.act !== 'function') {
            cached.exports.act = act;
          }
          if (
            cached.exports.default &&
            typeof cached.exports.default.act !== 'function'
          ) {
            cached.exports.default.act = act;
          }
        } catch {
          // exports.act may be non-configurable
        }
      }
    }
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
