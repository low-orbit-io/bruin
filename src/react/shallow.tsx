import React from 'react';
import { shallow } from '../vanilla/shallow';

export function useShallow<S, U>(selector: (state: S) => U): (state: S) => U {
  const prev = React.useRef<U | undefined>(undefined);

  return (state) => {
    const next = selector(state);
    if (prev.current === undefined) {
      return (prev.current = next);
    }
    return shallow(prev.current, next)
      ? prev.current
      : (prev.current = next);
  };
}
