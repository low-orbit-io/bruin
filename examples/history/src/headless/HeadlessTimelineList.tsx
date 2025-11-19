import React from 'react';
import { useHistoryState } from './useHistoryState';
import type { HeadlessTimelineListProps } from './types';

/**
 * Headless timeline component that renders a list of history entries.
 *
 * This component provides zero styling and maximum flexibility - you provide
 * the render function for each entry and control the appearance completely.
 *
 * @example
 * ```tsx
 * <HeadlessTimelineList
 *   store={myStore}
 *   renderEntry={(entry, index, isCurrent) => (
 *     <div className={isCurrent ? 'current' : ''}>
 *       {entry.name || 'Unnamed'}
 *       <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
 *     </div>
 *   )}
 * />
 * ```
 */
export function HeadlessTimelineList<T = any>({
  store,
  renderEntry,
  emptyMessage = 'No history entries yet',
  className,
  style,
}: HeadlessTimelineListProps<T>) {
  const { history, currentIndex } = useHistoryState(store);

  if (history.length === 0) {
    return (
      <div className={className} style={style}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={className} style={style}>
      {history.map((entry, index) => {
        const isCurrent = index === currentIndex;
        return (
          <React.Fragment key={index}>
            {renderEntry(entry, index, isCurrent)}
          </React.Fragment>
        );
      })}
    </div>
  );
}
