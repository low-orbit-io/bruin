import type { StoreApi } from '../../../../src/vanilla';

/**
 * History entry from the Bruin store
 */
export interface HistoryEntry<T = any> {
  state: T;
  timestamp: number;
  name?: string;
}

/**
 * Core props that all headless timeline components accept
 */
export interface HeadlessTimelineProps<T = any> {
  /** The Bruin store instance */
  store: StoreApi<T>;

  /** Optional className for the container */
  className?: string;

  /** Optional styles for the container */
  style?: React.CSSProperties;
}

/**
 * Props for the HeadlessTimelineList component
 */
export interface HeadlessTimelineListProps<T = any>
  extends HeadlessTimelineProps<T> {
  /**
   * Render function for each history entry
   * @param entry The history entry data
   * @param index The index in the history array
   * @param isCurrent Whether this is the current history position
   * @returns React element to render
   */
  renderEntry: (
    entry: HistoryEntry<T>,
    index: number,
    isCurrent: boolean,
  ) => React.ReactNode;

  /**
   * Optional: What to show when history is empty
   */
  emptyMessage?: React.ReactNode;
}

/**
 * Props for the HeadlessTimelineCompact component
 */
export interface HeadlessTimelineCompactProps<T = any>
  extends HeadlessTimelineProps<T> {
  /**
   * Optional: Show the history list when expanded
   */
  showList?: boolean;

  /**
   * Optional: Callback when list visibility changes
   */
  onToggleList?: (visible: boolean) => void;

  /**
   * Optional: Custom render for the compact controls
   */
  renderControls?: (controls: {
    canUndo: boolean;
    canRedo: boolean;
    currentIndex: number;
    totalEntries: number;
    undo: () => void;
    redo: () => void;
    toggleList: () => void;
    showList: boolean;
  }) => React.ReactNode;

  /**
   * Optional: Custom render for the expanded list
   */
  renderList?: (entries: HistoryEntry<T>[], currentIndex: number) => React.ReactNode;
}

/**
 * Return type for useHistoryState hook
 */
export interface HistoryState<T = any> {
  history: HistoryEntry<T>[];
  currentIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
}
