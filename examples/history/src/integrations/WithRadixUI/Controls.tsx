import * as Collapsible from '@radix-ui/react-collapsible';
import * as Separator from '@radix-ui/react-separator';
import { HeadlessTimelineCompact } from '../../headless';
import type { StoreApi } from '../../../../../src/vanilla';
import type { HistoryEntry } from '../../headless';
import './styles.css'; // Simple styling for demo purposes

/**
 * Compact history controls using Radix UI primitives
 *
 * Demonstrates how to use the headless HeadlessTimelineCompact component
 * with Radix UI's Collapsible and other primitives.
 *
 * @example
 * ```tsx
 * <RadixControls store={myStore} title="History Controls" />
 * ```
 */
interface RadixControlsProps<T = any> {
  /** The Bruin store instance */
  store: StoreApi<T>;

  /** Optional title for the controls */
  title?: string;

  /** Optional description text */
  description?: string;

  /** Custom render function for timeline entries when expanded */
  renderEntryContent?: (state: T, timestamp: number) => React.ReactNode;
}

export function RadixControls<T = any>({
  store,
  title = 'History Controls',
  description,
  renderEntryContent,
}: RadixControlsProps<T>) {
  return (
    <div className="radix-controls">
      <div className="radix-controls-header">
        <h3 className="radix-controls-title">{title}</h3>
        {description && (
          <p className="radix-controls-description">{description}</p>
        )}
      </div>

      <Separator.Root className="radix-separator" />

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
          <Collapsible.Root open={showList} onOpenChange={toggleList}>
            <div className="radix-controls-content">
              <div className="radix-controls-buttons">
                <button
                  onClick={undo}
                  disabled={!canUndo}
                  className="radix-button radix-button-primary"
                  aria-label="Undo last change"
                >
                  ← Undo
                </button>

                <span className="radix-controls-position" role="status">
                  {currentIndex + 1} / {totalEntries}
                </span>

                <button
                  onClick={redo}
                  disabled={!canRedo}
                  className="radix-button radix-button-primary"
                  aria-label="Redo next change"
                >
                  Redo →
                </button>

                <Collapsible.Trigger asChild>
                  <button className="radix-button radix-button-secondary" aria-label="Toggle timeline visibility">
                    {showList ? 'Hide' : 'Show'} Timeline
                  </button>
                </Collapsible.Trigger>
              </div>

              <div className="radix-controls-status">
                <span
                  className={`radix-status-badge ${canUndo ? 'radix-status-badge-success' : 'radix-status-badge-muted'}`}
                >
                  Can Undo: {canUndo.toString()}
                </span>
                <span
                  className={`radix-status-badge ${canRedo ? 'radix-status-badge-success' : 'radix-status-badge-muted'}`}
                >
                  Can Redo: {canRedo.toString()}
                </span>
              </div>
            </div>

            <Collapsible.Content className="radix-collapsible-content">
              <Separator.Root className="radix-separator" style={{ marginTop: '1rem', marginBottom: '1rem' }} />
              <div className="radix-timeline-compact">
                <p className="radix-timeline-compact-label">History Timeline:</p>
                <div className="radix-timeline-badges">
                  {/* This will be filled by renderList */}
                </div>
              </div>
            </Collapsible.Content>
          </Collapsible.Root>
        )}
        renderList={(entries: HistoryEntry<T>[], currentIndex: number) => (
          <div className="radix-timeline-compact">
            <p className="radix-timeline-compact-label">History Timeline:</p>
            <div className="radix-timeline-badges" role="list">
              {entries.map((entry, index) => {
                const isCurrent = index === currentIndex;
                return (
                  <span
                    key={index}
                    className={`radix-badge ${isCurrent ? 'radix-badge-current' : 'radix-badge-default'}`}
                    role="listitem"
                    aria-current={isCurrent ? 'true' : 'false'}
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
  );
}
