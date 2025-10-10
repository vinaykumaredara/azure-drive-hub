# Fix CI & Netlify Issues

## Description

This PR resolves the CI and Netlify build issues by addressing ESLint errors and improving the development workflow.

## Changes Made

### 1. Fixed ESLint Issues

#### React Hooks Rule Violation

- **File**: `src/components/CarCard.tsx`
- **Issue**: useCallback hooks were being called conditionally due to early return statements
- **Fix**: Moved all useCallback hooks to the top level of the component, before any conditional returns

#### TypeScript Comment Directive

- **File**: `src/components/SimpleImage.tsx`
- **Issue**: Used `@ts-ignore` instead of `@ts-expect-error`
- **Fix**: Replaced `@ts-ignore` with `@ts-expect-error` and added descriptive comment

### 2. Improved Pre-commit Hooks

#### Husky Configuration

- **File**: `.husky/pre-commit`
- **Issue**: Deprecated lines that would fail in husky v10.0.0
- **Fix**: Updated to use the new format

### 3. Verification

All local checks pass:

- ✅ ESLint with no errors (only 2 warnings about fast refresh)
- ✅ TypeScript compilation
- ✅ Build completes successfully
- ✅ Pre-commit hooks work correctly

## Test Results

- ESLint: `npx eslint . --ext .ts,.tsx` - Passes with only warnings
- TypeScript: `npm run type-check` - Passes with no errors
- Build: `npm run build` - Completes successfully
- Pre-commit: `git commit` - Hooks run correctly

## Notes

There are existing test failures in the codebase that are unrelated to these ESLint/CI issues:

- Authentication context issues in tests
- Image handling test expectations
- Supabase mock issues in tests

These pre-existing test failures are outside the scope of this fix.

## How to Test

1. Verify ESLint passes:

   ```bash
   npx eslint . --ext .ts,.tsx
   ```

2. Verify TypeScript compilation:

   ```bash
   npm run type-check
   ```

3. Verify build completes:

   ```bash
   npm run build
   ```

4. Test pre-commit hooks by making a small change and committing

## Related Issues

Fixes GitHub Actions ESLint failures with 'no-unused-vars' and grammar errors.
Fixes Netlify build issues by ensuring proper configuration.
