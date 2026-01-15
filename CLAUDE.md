# Bruin - History-enabled State Management

## Project Overview

Bruin is a lightweight state management library built on Zustand that adds automatic history tracking, undo/redo functionality, and named snapshots to every store. It's designed for applications that need time-travel debugging capabilities like design tools, form builders, data visualization tools, and code editors.

**Key Features:**
- Automatic undo/redo history for every store
- Transactions to batch multiple changes into one history entry
- Named snapshots for semantic checkpoints
- Full Zustand API compatibility
- TypeScript-first with full type inference
- React 18+ hooks-based API
- Vanilla JS support (no React required)

## Guidelines

- **NEVER** add "Generated with Claude Code", "Co-Authored-By: Claude", or any similar AI attribution to commits, PRs, or any content in this repository

## Essential Commands

### Development
```bash
# Install dependencies
pnpm install

# Build everything (cleans, builds all targets, runs post-build steps)
pnpm run build

# Build specific targets
pnpm run build:vanilla     # Vanilla store implementation
pnpm run build:react       # React hooks
pnpm run build:middleware  # Middleware (devtools, persist, immer, etc.)
pnpm run build:tsup        # Alternative build with tsup

# Watch mode for development
pnpm run watch:tsup
```

### Testing
```bash
# Run all tests (formats, types, lints, specs across all build targets)
pnpm test

# Run specific test suites
pnpm run test:spec          # Run tests against source code
pnpm run test:spec:vanilla  # Only vanilla store tests
pnpm run test:spec:sequences # Sequence/integration tests
pnpm run test:spec:middleware # Middleware tests
pnpm run test:spec:react    # React hooks tests

# Test built artifacts
pnpm run test:spec:cjs      # Test CommonJS build
pnpm run test:spec:esm      # Test ESM build
pnpm run test:spec:tsup-cjs # Test tsup CJS build
pnpm run test:spec:tsup-esm # Test tsup ESM build

# Type checking
pnpm run test:types

# Linting
pnpm run test:lint
pnpm run fix:lint          # Auto-fix lint errors
```

### Code Quality
```bash
# Format code
pnpm run fix:format

# Fix all (format + lint)
pnpm run fix
```

### Publishing a Release

Publishing is automated via GitHub Actions when you push a version tag. This will:
1. Publish the package to npm as `@low-orbit/bruin`
2. Create a GitHub Release with the tarball attached

```bash
# 1. Ensure all tests pass locally
pnpm test

# 2. Decide on version number (follow semver)
#    - MAJOR (1.0.0 → 2.0.0): Breaking changes
#    - MINOR (1.2.0 → 1.3.0): New features, backwards compatible
#    - PATCH (1.2.0 → 1.2.1): Bug fixes, backwards compatible

# 3. Create and push a version tag
git tag v1.3.0
git push origin v1.3.0

# The GitHub Actions workflows will:
#   - Extract version from tag (v1.3.0 → 1.3.0)
#   - Run tests
#   - Build the package
#   - Update dist/package.json with the version
#   - Publish to npm (publish.yml)
#   - Create a GitHub Release with tarball (release.yml)
```

#### Local Testing (optional)
```bash
# Dry run to verify package contents
pnpm run release:dry

# Build and inspect dist/ manually
pnpm run build
ls -la dist/
```

#### Installing the Published Package

```bash
pnpm add @low-orbit/bruin
# or
npm install @low-orbit/bruin
```

#### Troubleshooting Publish Failures

1. **Check the Actions tab** in GitHub for workflow logs
2. **Common issues:**
   - Tests failing: Fix tests locally first
   - Build errors: Run `pnpm run build` locally to debug
   - npm auth errors: Verify `NPM_TOKEN` secret is set in repo settings
3. **Re-run failed workflow:** Delete the tag, fix the issue, re-tag:
   ```bash
   git tag -d v1.3.0              # Delete local tag
   git push origin :v1.3.0        # Delete remote tag
   # Fix the issue...
   git tag v1.3.0                 # Re-create tag
   git push origin v1.3.0         # Push again
   ```

## Code Architecture

### Directory Structure

```
bruin/
├── src/
│   ├── vanilla.ts              # Core store implementation (history, snapshots)
│   ├── react.ts                # React hooks wrapper (useStore, create)
│   ├── middleware.ts           # Middleware re-exports
│   ├── middleware/
│   │   ├── devtools.ts        # Redux DevTools integration
│   │   ├── persist.ts         # State persistence with history
│   │   ├── immer.ts           # Immer integration for immutable updates
│   │   ├── redux.ts           # Redux compatibility
│   │   ├── combine.ts         # Store composition
│   │   └── subscribeWithSelector.ts # Selective subscriptions
│   ├── types/
│   │   ├── core.ts            # Core type definitions (StoreApi, StateCreator, etc.)
│   │   ├── react.ts           # React-specific types
│   │   └── middleware.ts      # Middleware types
│   ├── shallow.ts             # Shallow comparison utilities
│   └── traditional.ts         # Traditional (class-based) API
├── tests/
│   ├── vanilla/               # Core functionality tests
│   ├── sequences/             # Integration/sequence tests
│   ├── middleware/            # Middleware tests
│   └── react/                 # React hooks tests
├── docs/
│   ├── guides/                # User guides
│   └── apis/                  # API documentation
├── dist/                      # Rollup build output (CJS + declarations)
├── dist-tsup/                 # tsup build output (CJS + ESM)
└── rollup.config.mjs          # Rollup build configuration
```

### Core Architecture Patterns

#### 1. **Vanilla Core (src/vanilla.ts)**

The heart of Bruin is `createStoreImpl()` which manages:

- **State Management**: Immutable state updates via `setState()`
- **History Tracking**: Snapshot-based history array with pointer (`historyIndex`)
- **Transactions**: Batch multiple updates into single history entry
- **Named Snapshots**: Semantic checkpoints stored separately from history
- **Memory Management**: Size estimation and automatic cleanup when limits reached
- **Subscriptions**: Notify listeners on state changes

**Key Invariant:** `currentState === history[historyIndex].state` must always be true

**Critical Methods:**
- `setState()`: Update state, create history entry
- `transaction()`: Batch updates into single history entry
- `undo()/redo()`: Navigate history by moving pointer
- `getCurrentHistoryIndex()`: Get current position in history
- `saveSnapshot(name)`: Create named checkpoint
- `loadSnapshot(id)`: Restore snapshot (always adds to history)
- `getHistory()`: Get all history entries (for debugging/DevTools)

#### 2. **React Bindings (src/react.ts)**

Thin wrapper over vanilla core:
- `create()`: Creates a vanilla store + React hook
- `useStore()`: Hook that subscribes to store updates using `useSyncExternalStore`
- Returns store API methods directly on the hook (e.g., `useStore.undo()`)

#### 3. **Middleware System**

Middleware wraps `StateCreator` functions to add functionality:
- **devtools**: Redux DevTools integration
- **persist**: LocalStorage/SessionStorage persistence with history support
- **immer**: Immer for mutable-style updates (converted to immutable)
- **combine**: Compose multiple stores
- **subscribeWithSelector**: Subscribe to specific state slices

Middleware uses TypeScript's type system with `StoreMutators` to maintain type inference through composition.

#### 4. **Type System (src/types/core.ts)**

Bruin's sophisticated type system provides:
- **StateCreator**: Function that creates store state
- **StoreApi**: Full API surface (setState, getState, subscribe, history methods)
- **Mutate**: Type-level middleware composition
- **StoreMutators**: Interface for middleware type extensions

### Build System

#### Rollup Configuration
- Builds multiple entry points (vanilla, react, middleware, shallow)
- Generates CommonJS (.js) and ESM (.mjs) formats
- Creates TypeScript declarations (.d.ts, .d.mts)
- Handles React Native, ESM, and CJS exports via package.json exports map

#### tsup Configuration
- Alternative build using tsup (faster for development)
- Outputs to `dist-tsup/`
- CJS + ESM formats
- Used in development workflow

#### Post-Build Steps (package.json:postbuild)
1. `patch-d-ts`: Fix import paths in declaration files
2. `copy`: Copy built files, move ESM to dist/esm, copy package.json/README/LICENSE
3. `patch-old-ts`: Create compatibility file for old TypeScript
4. `patch-esm-ts`: Rename .d.ts to .d.mts and fix imports for ESM

### Test Infrastructure

#### Vitest Configuration (vitest.config.mts)

**Test Projects:**
1. **vanilla**: Core functionality tests (Node environment)
2. **sequences**: Integration tests for complex workflows (Node)
3. **middleware**: Middleware tests (Node)
4. **react**: React hooks tests (happy-dom environment)

**Build Testing:**
- Tests run against source by default
- Can test built artifacts via `TEST_BUILD` env var:
  - `TEST_BUILD=cjs`: Test dist/ CJS build
  - `TEST_BUILD=esm`: Test dist/esm/ ESM build
  - `TEST_BUILD=tsup-cjs`: Test dist-tsup/ CJS build
  - `TEST_BUILD=tsup-esm`: Test dist-tsup/ ESM build

#### Test Files
- `tests/vanilla/basic.test.ts`: Core store functionality
- `tests/vanilla/snapshots.test.ts`: Named snapshots API
- `tests/sequences/snapshots-sequences.test.ts`: Complex snapshot workflows
- `tests/middleware/`: Middleware integration tests
- `tests/react/`: React hooks behavior

### Design Decisions

#### History Navigation Philosophy

**What Bruin Provides:**
- **Single-step navigation**: `undo()` and `redo()` for relative motion
- **Semantic navigation**: `saveSnapshot(name)` and `loadSnapshot(id)` for meaningful checkpoints
- **Read-only introspection**: `getHistory()` and `getCurrentHistoryIndex()` for DevTools/debugging

**What Bruin Intentionally Does NOT Provide:**
- ❌ `undoTo(index)` - Requires knowing exact position
- ❌ `redoTo(index)` - Requires knowing exact position
- ❌ `undoSteps(n)` - Requires knowing distance to target state

**Rationale:** Positional navigation requires meta-knowledge about history structure that developers never have in real applications. Users think in terms of:
- **Meaningful states**: "before-experiment" (use snapshots)
- **Relative motion**: "go back one" (use undo/redo)
- NOT **absolute positions**: "go to index 3" (impossible to know)

See CHANGELOG.md "Design Decisions" section for detailed philosophy.

#### Snapshot Loading Always Adds to History

`loadSnapshot(id)` always creates a new history entry. This maintains the invariant that `currentState === history[historyIndex].state`.

**Previously had (removed):** `loadSnapshot(id, { addToHistory: false })` option
**Problem:** Created "detached head" state where current state didn't match history pointer
**Solution:** Always add to history, enforce invariant

#### Index-Based vs Value-Based Comparison

When displaying history or highlighting current position, always use **index comparison**:
```typescript
// CORRECT
const currentIndex = getCurrentHistoryIndex();
const isCurrent = index === currentIndex;

// WRONG - fails when duplicate state values exist
const isCurrent = entryValue === currentValue;
```

## Common Workflows

### Adding a New Method to StoreApi

1. Add type signature to `StoreApi<T>` in `src/types/core.ts`
2. Implement method in `createStoreImpl()` in `src/vanilla.ts`
3. Return method in api object
4. Update `src/types/react.ts` if React-specific behavior needed
5. Update `docs/apis/create-store.md` with method documentation
6. Add tests in `tests/vanilla/basic.test.ts` or appropriate file
7. Run `pnpm test` to verify all builds pass

### Adding a New Middleware

1. Create file in `src/middleware/yourMiddleware.ts`
2. Export from `src/middleware.ts`
3. Add type to `src/types/middleware.ts` if needed
4. Create tests in `tests/middleware/yourMiddleware.test.ts`
5. Document in `docs/guides/` or `docs/apis/`
6. Add to rollup config entry points if separate entry needed

### Debugging Test Failures

1. Check which test project failed (vanilla/sequences/middleware/react)
2. Check which build target failed (source/cjs/esm/tsup-cjs/tsup-esm)
3. Run specific test: `pnpm run test:spec:vanilla` or `TEST_BUILD=cjs pnpm run test:spec`
4. Check for:
   - Type errors (optional methods marked required?)
   - History invariant violations
   - Memory estimation issues
   - Snapshot/history independence

## Important Files

### Core Implementation
- **src/vanilla.ts** (1000+ lines): Core store with history, transactions, snapshots
- **src/types/core.ts** (170 lines): All type definitions
- **src/react.ts** (100 lines): React hooks wrapper

### Configuration
- **package.json**: Scripts, dependencies, exports map
- **rollup.config.mjs**: Production build configuration
- **tsup.config.ts**: Development build configuration
- **vitest.config.mts**: Test configuration

### Documentation
- **CHANGELOG.md**: Version history and breaking changes
- **docs/guides/history-and-time-travel.md**: User guide for history features
- **docs/apis/create-store.md**: API reference for createStore

### Tests
- **tests/vanilla/basic.test.ts**: Core functionality verification
- **tests/vanilla/snapshots.test.ts**: Named snapshots API
- **tests/sequences/snapshots-sequences.test.ts**: Complex workflows

## Testing Strategy

1. **Unit Tests**: Test individual methods in isolation
2. **Sequence Tests**: Test complex workflows (state changes → snapshot → undo → load)
3. **Build Tests**: Verify all build targets work (CJS, ESM, tsup-cjs, tsup-esm)
4. **Type Tests**: Ensure TypeScript inference works correctly
5. **React Tests**: Verify hooks behavior with concurrent React features

**Test Requirements:**
- All tests must pass across all build targets
- No TypeScript errors
- No ESLint warnings
- Code formatted with Prettier

## Known Gotchas

1. **Don't mutate state directly**: Use `setState()` or `transaction()`
2. **History stores full snapshots**: Not diffs, so large states consume more memory
3. **Computed fields excluded from history**: Use `options.computedFields` to specify
4. **Snapshot loading always adds history**: Can't load without creating new entry
5. **Memory limits apply to combined history + snapshots**: Not separate limits
6. **Transactions can't be nested**: Inner transaction is ignored
7. **Optional types should be required if always present**: Check StoreApi interface

## Related Projects

- **mapper** (`/Users/rstovall/Development/mapper`): Test/demo application for Bruin
  - Uses Mantine UI components
  - Visualizes history entries, snapshots, memory usage
  - Demonstrates undo/redo, transactions, snapshot loading
  - npm linked to local Bruin for development

## Recent Major Changes

See CHANGELOG.md for full history. Recent breaking changes:

1. **Added `getCurrentHistoryIndex()`**: Returns current position in history array
2. **Removed `addToHistory` option from `loadSnapshot()`**: Always adds to history now
3. **Removed positional navigation**: No `undoTo()`, `redoTo()`, `undoSteps()` methods
4. **Made optional methods required**: `clearHistory`, `getSnapshot` always present

## Useful Links

- GitHub: https://github.com/low-orbit-io/bruin
- npm: https://www.npmjs.com/package/@low-orbit/bruin
- Zustand (base library): https://github.com/pmndrs/zustand
