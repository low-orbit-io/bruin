import type { SetStateWithTransaction } from './core';

export type Write<T, U> = Omit<T, keyof U> & U;

export type NamedSet<T> = SetStateWithTransaction<T> & {
  (
    partial: T | Partial<T> | ((state: T) => T | Partial<T>),
    replace?: boolean,
    optionsOrAction?:
      | { skipHistory?: boolean }
      | string
      | { type: string; [key: string]: any },
  ): void;
};
