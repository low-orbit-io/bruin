# GitHub Actions Workflows

## Active Workflows

1. **ci.yml** - Main CI pipeline (build, test, lint, format)
2. **compatibility.yml** - Version matrix testing (TypeScript/React versions)
3. **publish.yml** - Publish to GitHub Packages on tag push

## Disabled Workflows

Disabled workflows have `.disabled` extension:

1. **ci.yml.disabled** - Old CI pipeline
2. **compatibility.yml.disabled** - Old compatibility tests
3. **pr.yml.disabled** - PR-specific checks (bundle size, dependency review)
4. **publish.yml.disabled** - Old NPM publishing workflow
5. **update-lockfile.yml.disabled** - Lockfile updates

## Publishing

The `publish.yml` workflow publishes to GitHub Packages when a version tag is pushed.

### How to Publish

```bash
# 1. Ensure all tests pass locally
pnpm test

# 2. Decide on version number (follow semver)
#    - MAJOR (1.0.0 -> 2.0.0): Breaking changes
#    - MINOR (1.2.0 -> 1.3.0): New features, backwards compatible
#    - PATCH (1.2.0 -> 1.2.1): Bug fixes, backwards compatible

# 3. Create and push a version tag
git tag v1.3.0
git push origin v1.3.0
```

The workflow will:
1. Extract version from tag (e.g., `v1.3.0` -> `1.3.0`)
2. Run tests
3. Build the package
4. Update `dist/package.json` with the version
5. Publish to GitHub Packages

### Local Testing (optional)

```bash
# Dry run to verify package contents
pnpm run release:dry

# Build and inspect dist/ manually
pnpm run build
ls -la dist/
```

### Installing the Package

Developers need a `.npmrc` file configured for GitHub Packages:

```
@inboxhealth:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_PAT
```

Then install:
```bash
pnpm add @inboxhealth/bruin
# or
npm install @inboxhealth/bruin
```

### Troubleshooting Publish Failures

1. **Check the Actions tab** in GitHub for workflow logs
2. **Common issues:**
   - Tests failing: Fix tests locally first
   - Build errors: Run `pnpm run build` locally to debug
   - Auth errors: Verify `GITHUB_TOKEN` has `packages:write` permission
3. **Re-run failed workflow:** Delete the tag, fix the issue, re-tag:
   ```bash
   git tag -d v1.3.0              # Delete local tag
   git push origin :v1.3.0        # Delete remote tag
   # Fix the issue...
   git tag v1.3.0                 # Re-create tag
   git push origin v1.3.0         # Push again
   ```

## To Re-enable Disabled Workflows

```bash
mv workflow-name.yml.disabled workflow-name.yml
```