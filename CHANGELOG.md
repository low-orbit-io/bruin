# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Named snapshots feature
- Memory estimation and limits
- Enhanced devtools integration

## [0.1.0] - TBD

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

[Unreleased]: https://github.com/low-orbit-io/bruin/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/low-orbit-io/bruin/releases/tag/v0.1.0
