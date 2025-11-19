import React, { useState } from 'react';
import { useHistoryState } from './useHistoryState';
import type { HeadlessTimelineCompactProps } from './types';

/**
 * Headless compact timeline component with undo/redo controls.
 *
 * This component provides a minimal footprint UI pattern - just undo/redo buttons
 * and optionally an expandable list. No styling is applied.
 *
 * @example
 * ```tsx
 * <HeadlessTimelineCompact
 *   store={myStore}
 *   renderControls={({ canUndo, canRedo, currentIndex, totalEntries, undo, redo }) => (
 *     <div>
 *       <button onClick={undo} disabled={!canUndo}>←</button>
 *       <span>{currentIndex + 1} / {totalEntries}</span>
 *       <button onClick={redo} disabled={!canRedo}>→</button>
 *     </div>
 *   )}
 * />
 * ```
 */
export function HeadlessTimelineCompact<T = any>({
  store,
  showList: controlledShowList,
  onToggleList,
  renderControls,
  renderList,
  className,
  style,
}: HeadlessTimelineCompactProps<T>) {
  const { history, currentIndex, canUndo, canRedo, undo, redo } =
    useHistoryState(store);

  const [internalShowList, setInternalShowList] = useState(false);

  // Use controlled or internal state
  const showList = controlledShowList ?? internalShowList;

  const toggleList = () => {
    const newValue = !showList;
    if (onToggleList) {
      onToggleList(newValue);
    } else {
      setInternalShowList(newValue);
    }
  };

  const controls = {
    canUndo,
    canRedo,
    currentIndex,
    totalEntries: history.length,
    undo,
    redo,
    toggleList,
    showList,
  };

  return (
    <div className={className} style={style}>
      {renderControls ? (
        renderControls(controls)
      ) : (
        <div>
          <button onClick={undo} disabled={!canUndo}>
            Undo
          </button>
          <span>
            {currentIndex + 1} / {history.length}
          </span>
          <button onClick={redo} disabled={!canRedo}>
            Redo
          </button>
          <button onClick={toggleList}>
            {showList ? 'Hide' : 'Show'} History
          </button>
        </div>
      )}

      {showList &&
        (renderList ? (
          renderList(history, currentIndex)
        ) : (
          <ul>
            {history.map((entry, index) => (
              <li key={index} data-current={index === currentIndex}>
                {entry.name || 'Unnamed'} -{' '}
                {new Date(entry.timestamp).toLocaleTimeString()}
              </li>
            ))}
          </ul>
        ))}
    </div>
  );
}
