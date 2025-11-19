#!/bin/bash

set -e

echo "🔍 Verifying build output..."

# Check required files exist
files=(
  "dist/index.js"
  "dist/index.d.ts"
  "dist/esm/index.mjs"
  "dist/esm/index.d.mts"
  "dist/vanilla.js"
  "dist/vanilla.d.ts"
  "dist/middleware.js"
  "dist/middleware.d.ts"
  "dist/react.js"
  "dist/react.d.ts"
  "dist/shallow.js"
  "dist/shallow.d.ts"
  "dist/package.json"
  "dist/README.md"
  "dist/LICENSE"
)

missing_files=()

for file in "${files[@]}"; do
  if [ ! -f "$file" ]; then
    echo "❌ Missing: $file"
    missing_files+=("$file")
  else
    echo "✅ Found: $file"
  fi
done

if [ ${#missing_files[@]} -ne 0 ]; then
  echo ""
  echo "❌ Build verification failed! Missing ${#missing_files[@]} files."
  exit 1
fi

echo ""
echo "✨ Build verification complete! All required files present."
