import * as React from 'react';
import { act } from 'react';

(React as any).act = act;
(globalThis as any).React = React;

if (typeof require !== 'undefined') {
  const Module = require('module') as typeof import('module');
  const originalRequire = Module.prototype.require;

  Module.prototype.require = function (id: string) {
    const module = originalRequire.apply(this, [id] as any);

    if (id === 'react' && module) {
      module.act = act;
      if (module.default) {
        module.default.act = act;
      }
    }

    return module;
  };

  const reactModule = require('react');

  reactModule.act = act;

  if (reactModule.default) {
    reactModule.default.act = act;
  }

  try {
    const reactDomTestUtils = require('react-dom/test-utils');
    reactDomTestUtils.act = act;
  } catch {
    // react-dom/test-utils might not be available in all environments
  }
}

import '@testing-library/jest-dom/vitest';
