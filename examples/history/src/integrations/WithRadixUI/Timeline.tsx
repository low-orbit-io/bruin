import * as Separator from '@radix-ui/react-separator';
import { HeadlessTimelineList } from '../../headless';
import type { StoreApi } from '../../../../../src/vanilla';
import type { HistoryEntry } from '../../headless';
import './styles.css'; // Simple styling for demo purposes

/**
 * Timeline component using Radix UI primitives
 *
 * Demonstrates how to use the headless HeadlessTimelineList component
 * with Radix UI's unstyled, accessible primitives.
 *
 * @example
 * ```tsx
 * <RadixTimeline store={myStore} title="State History" />
 * ```
 */
interface RadixTimelineProps<T = any> {
  /** The Bruin store instance */
  store: StoreApi<T>;

  /** Optional title for the timeline */
  title?: string;

  /** Optional description text */
  description?: string;

  /** Custom render function for entry content */
  renderEntryContent?: (state: T, timestamp: number) => React.ReactNode;
}

export function RadixTimeline<T = any>({
  store,
  title = 'History Timeline',
  description,
  renderEntryContent,
}: RadixTimelineProps<T>) {
  return (
    <div className="radix-timeline">
      <div className="radix-timeline-header">
        <h3 className="radix-timeline-title">{title}</h3>
        {description && (
          <p className="radix-timeline-description">{description}</p>
        )}
      </div>

      <Separator.Root className="radix-separator" />

      <div className="radix-timeline-content">
        <HeadlessTimelineList
          store={store}
          renderEntry={(entry: HistoryEntry<T>, index: number, isCurrent: boolean) => (
            <div
              key={index}
              className={`radix-timeline-entry ${isCurrent ? 'radix-timeline-entry-current' : ''}`}
              role="listitem"
              aria-current={isCurrent ? 'true' : 'false'}
            >
              <div className="radix-timeline-entry-content">
                {renderEntryContent ? (
                  renderEntryContent(entry.state, entry.timestamp)
                ) : (
                  <code className="radix-timeline-entry-state">
                    {JSON.stringify(entry.state)}
                  </code>
                )}
              </div>
              <div className="radix-timeline-entry-meta">
                {isCurrent && (
                  <span className="radix-timeline-entry-badge">Current</span>
                )}
                <time className="radix-timeline-entry-time">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </time>
              </div>
            </div>
          )}
          emptyMessage={
            <p className="radix-timeline-empty">
              No history entries yet. Make some changes to see history!
            </p>
          }
        />
      </div>
    </div>
  );
}
