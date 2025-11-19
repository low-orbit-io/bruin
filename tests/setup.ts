import '@testing-library/jest-dom/vitest';
import { act } from 'react';
import * as React from 'react';

// Patch React.act for testing environments (especially CommonJS builds)
// React 19 has act in ESM but not always in CJS, this ensures compatibility
if (typeof (React as any).act !== 'function') {
  (React as any).act = act;
}
