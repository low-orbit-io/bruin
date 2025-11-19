import { HeadlessTimelineCompact } from '../../headless';
import type { StoreApi } from '../../../../../src/vanilla';
import type { HistoryEntry } from '../../headless';

/**
 * Compact history controls using Tailwind CSS utility classes
 *
 * Demonstrates how to use the headless HeadlessTimelineCompact component
 * with Tailwind's utility-first approach.
 *
 * @example
 * ```tsx
 * <TailwindControls store={myStore} title="History Controls" />
 * ```
 */
interface TailwindControlsProps<T = any> {
  /** The Bruin store instance */
  store: StoreApi<T>;

  /** Optional title for the controls */
  title?: string;

  /** Optional description text */
  description?: string;

  /** Custom render function for timeline entries when expanded */
  renderEntryContent?: (state: T, timestamp: number) => React.ReactNode;
}

export function TailwindControls<T = any>({
  store,
  title = 'History Controls',
  description,
  renderEntryContent,
}: TailwindControlsProps<T>) {
  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        {description && (
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        )}
      </div>

      <div className="border-t border-gray-200 pt-4">
        <HeadlessTimelineCompact
          store={store}
          renderControls={({
            canUndo,
            canRedo,
            currentIndex,
            totalEntries,
            undo,
            redo,
            toggleList,
            showList,
          }) => (
            <div className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={undo}
                  disabled={!canUndo}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  aria-label="Undo last change"
                >
                  ← Undo
                </button>

                <span className="px-4 py-2 bg-gray-100 rounded-lg font-mono font-bold text-lg">
                  {currentIndex + 1} / {totalEntries}
                </span>

                <button
                  onClick={redo}
                  disabled={!canRedo}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  aria-label="Redo next change"
                >
                  Redo →
                </button>

                <button
                  onClick={toggleList}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium ml-auto"
                >
                  {showList ? 'Hide' : 'Show'} Timeline
                </button>
              </div>

              <div className="flex gap-2">
                <span
                  className={`
                    px-3 py-1 rounded-full text-xs font-semibold
                    ${canUndo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}
                  `}
                >
                  <span className={`inline-block w-2 h-2 rounded-full mr-1 ${canUndo ? 'bg-green-500' : 'bg-gray-400'}`} />
                  Can Undo: {canUndo.toString()}
                </span>
                <span
                  className={`
                    px-3 py-1 rounded-full text-xs font-semibold
                    ${canRedo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}
                  `}
                >
                  <span className={`inline-block w-2 h-2 rounded-full mr-1 ${canRedo ? 'bg-green-500' : 'bg-gray-400'}`} />
                  Can Redo: {canRedo.toString()}
                </span>
              </div>
            </div>
          )}
          renderList={(entries: HistoryEntry<T>[], currentIndex: number) => (
            <div className="mt-4 border-t border-gray-200 pt-4 space-y-2">
              <p className="text-sm font-semibold text-gray-700">
                History Timeline:
              </p>
              <div className="flex flex-wrap gap-2">
                {entries.map((entry, index) => {
                  const isCurrent = index === currentIndex;
                  return (
                    <span
                      key={index}
                      className={`
                        px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                        ${
                          isCurrent
                            ? 'bg-blue-500 text-white shadow-md'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }
                      `}
                    >
                      {renderEntryContent ? (
                        renderEntryContent(entry.state, entry.timestamp)
                      ) : (
                        `#${index + 1}`
                      )}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        />
      </div>
    </div>
  );
}
