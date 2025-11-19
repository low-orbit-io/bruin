import * as React from 'react';
import { act } from 'react';

Object.defineProperty(React, 'act', {
  value: act,
  writable: true,
  configurable: true,
  enumerable: true,
});

Object.defineProperty(globalThis, 'React', {
  value: React,
  writable: true,
  configurable: true,
  enumerable: true,
});

import '@testing-library/jest-dom/vitest';
