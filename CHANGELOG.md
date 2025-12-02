# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- `getCurrentHistoryIndex()` method to expose the current history pointer position
  - Returns the current index in the history array (-1 if no history)
  - Enables proper UI highlighting based on position rather than state value
  - Fixes incorrect highlighting when multiple history entries have the same state value
  - **Location:** `src/vanilla.ts:735`, `src/types/core.ts:81`

### Changed
- **BREAKING:** Simplified `loadSnapshot()` API by removing the `addToHistory` option
  - **Old:** `loadSnapshot(id: string, options?: SnapshotRestoreOptions): boolean`
  - **New:** `loadSnapshot(id: string): boolean`
  - Snapshot loading now **always** adds a history entry to maintain the history pointer invariant
  - Removed `SnapshotRestoreOptions` type entirely
  - **Rationale:** Loading snapshots without adding to history creates a "detached head" state where `currentState !== history[historyIndex].state`, violating the core invariant that the current state always matches the history pointer
  - **Migration:** Remove the second parameter from all `loadSnapshot()` calls
  - **Location:** `src/vanilla.ts:982`, `src/types/core.ts:96`

### Design Decisions
- **No positional navigation methods:** Bruin intentionally does NOT provide `undoTo(index)`, `redoTo(index)`, or `undoSteps(n)` methods
  - **Rationale:** These methods require meta-knowledge about history structure that developers never have in real applications
  - Users think in terms of **meaningful states** ("before experiment") and **relative motion** ("go back one"), not **absolute positions** ("go to index 3")
  - **Correct patterns:**
    - For single-step navigation: Use `undo()` and `redo()`
    - For semantic navigation: Use named snapshots with `saveSnapshot()` and `loadSnapshot()`
    - For DevTools/testing: Use `getHistory()` and `getCurrentHistoryIndex()` to build custom UIs
  - See CHANGELOG_DRAFT.md for detailed philosophy and examples

### Planned
- Enhanced devtools integration
- Additional history configuration options

## [1.2.0] - TBD

### Added
- Initial release of Bruin
- Core history management with undo/redo functionality
- Transaction support for grouped state changes
- Computed fields that update based on state
- Persist middleware with history support
- DevTools integration for debugging
- Full TypeScript support with type inference
- Zustand API compatibility for easy migration
- Multiple middleware options (immer, devtools, persist)
- Shallow comparison utilities
- Redux middleware for Redux DevTools integration

### Features
- **History Management**: Built-in undo/redo with configurable history limits
- **Transactions**: Group multiple state changes into a single history entry
- **Computed Fields**: Automatically derived state that updates reactively
- **Middleware**: Compatible with standard Zustand middleware
- **TypeScript**: First-class TypeScript support with full type inference
- **React Integration**: Hooks-based API for React 18+
- **Vanilla JS**: Can be used without React for vanilla JavaScript projects

[Unreleased]: https://github.com/InboxHealth/bruin/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/InboxHealth/bruin/releases/tag/v1.2.0
