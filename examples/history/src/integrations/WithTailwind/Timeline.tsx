import { HeadlessTimelineList } from '../../headless';
import type { StoreApi } from '../../../../../src/vanilla';
import type { HistoryEntry } from '../../headless';

/**
 * Timeline component using Tailwind CSS utility classes
 *
 * Demonstrates how to use the headless HeadlessTimelineList component
 * with Tailwind's utility-first approach.
 *
 * @example
 * ```tsx
 * <TailwindTimeline store={myStore} title="State History" />
 * ```
 */
interface TailwindTimelineProps<T = any> {
  /** The Bruin store instance */
  store: StoreApi<T>;

  /** Optional title for the timeline */
  title?: string;

  /** Optional description text */
  description?: string;

  /** Custom render function for entry content */
  renderEntryContent?: (state: T, timestamp: number) => React.ReactNode;
}

export function TailwindTimeline<T = any>({
  store,
  title = 'History Timeline',
  description,
  renderEntryContent,
}: TailwindTimelineProps<T>) {
  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        {description && (
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        )}
      </div>

      <div className="border-t border-gray-200 pt-4">
        <HeadlessTimelineList
          store={store}
          renderEntry={(entry: HistoryEntry<T>, index: number, isCurrent: boolean) => (
            <div
              key={index}
              className={`
                p-3 mb-2 rounded-lg border-2 transition-all
                ${
                  isCurrent
                    ? 'bg-blue-50 border-blue-500 shadow-md'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  {renderEntryContent ? (
                    renderEntryContent(entry.state, entry.timestamp)
                  ) : (
                    <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                      {JSON.stringify(entry.state)}
                    </code>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {isCurrent && (
                    <span className="px-2 py-1 text-xs font-semibold bg-blue-500 text-white rounded-full">
                      Current
                    </span>
                  )}
                  <time className="text-xs text-gray-500">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </time>
                </div>
              </div>
            </div>
          )}
          emptyMessage={
            <div className="text-center py-12 text-gray-500">
              No history entries yet. Make some changes to see history!
            </div>
          }
        />
      </div>
    </div>
  );
}
