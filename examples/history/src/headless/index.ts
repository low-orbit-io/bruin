/**
 * Headless History Timeline Components
 *
 * These components provide history visualization functionality with zero styling.
 * They work with any Bruin store and can be styled however you want.
 *
 * @module headless
 */

export { HeadlessTimelineList } from './HeadlessTimelineList';
export { HeadlessTimelineCompact } from './HeadlessTimelineCompact';
export { useHistoryState } from './useHistoryState';

export type {
  HistoryEntry,
  HeadlessTimelineProps,
  HeadlessTimelineListProps,
  HeadlessTimelineCompactProps,
  HistoryState,
} from './types';
