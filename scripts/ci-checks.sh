#!/bin/bash

# CI Checks Script
# This script runs all the necessary checks for the CI pipeline:
# 1. Typecheck with npx tsc --noEmit
# 2. Smoke test script

echo "🚀 Starting CI Checks..."

# Run typecheck
echo "🔍 Running TypeScript typecheck..."
npx tsc --noEmit
if [ $? -eq 0 ]; then
  echo "✅ Typecheck passed"
else
  echo "❌ Typecheck failed"
  exit 1
fi

# Run smoke test
echo "🔥 Running smoke test..."
node scripts/smoke-test.js
if [ $? -eq 0 ]; then
  echo "✅ Smoke test passed"
else
  echo "❌ Smoke test failed"
  exit 1
fi

echo "🎉 All CI checks passed!"