# GitHub Actions Workflows - Currently Disabled

All workflows have been temporarily disabled by adding `.disabled` extension.

## Disabled Workflows

1. **ci.yml.disabled** - Main CI pipeline (tests, lint, format, build)
2. **compatibility.yml.disabled** - Version matrix testing (TypeScript/React versions)
3. **pr.yml.disabled** - PR-specific checks (bundle size, dependency review)
4. **publish.yml.disabled** - NPM publishing (already set to manual only)
5. **update-lockfile.yml.disabled** - Lockfile updates

## To Re-enable Workflows

To re-enable a specific workflow:
```bash
mv workflow-name.yml.disabled workflow-name.yml
```

To re-enable all workflows:
```bash
cd .github/workflows
for file in *.yml.disabled; do
  mv "$file" "${file%.disabled}"
done
```

## Status
- **Disabled on:** November 18, 2025
- **Reason:** Workflows failing due to complex sed patching and circular dependencies
- **Next steps:** Implement tsup build system or simplify workflows

## Planned Improvements
1. Migrate from Rollup to tsup (eliminates patching)
2. Simplify version matrix (test only critical versions)
3. Remove sed-based file modifications
4. Use environment variables instead of file patching