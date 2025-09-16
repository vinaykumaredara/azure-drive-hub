# RP CARS - Dev Server QA Checklist

This checklist verifies that all dev server reliability fixes have been applied correctly.

## Prerequisites
- [ ] Node.js installed (v16 or higher)
- [ ] npm installed
- [ ] Git repository cloned
- [ ] Dependencies installed (`npm install`)

## 1. Vite Configuration Verification

### Check vite.config.ts
- [ ] File exists at `./vite.config.ts`
- [ ] `server.host` is set to `true`
- [ ] `server.port` is set to `5173`
- [ ] `server.strictPort` is set to `false`
- [ ] HMR configuration is simplified

### Command to verify:
```bash
grep -A 10 "server:" vite.config.ts
```

Expected output should show:
```javascript
server: {
  host: true,
  port: 5173,
  strictPort: false,
```

## 2. Package.json Script Verification

### Check package.json scripts
- [ ] File exists at `./package.json`
- [ ] `dev:preflight` script exists
- [ ] `dev` script includes preflight
- [ ] `dev:clean` script exists
- [ ] `test:smoke` script exists
- [ ] `kill-port` is in devDependencies

### Command to verify:
```bash
npm run | grep "dev"
```

Expected output should show:
```
  dev
  dev:clean
  dev:mobile
  dev:preflight
```

## 3. README Documentation Verification

### Check README.md
- [ ] File exists at `./README.md`
- [ ] "Development Troubleshooting" section exists
- [ ] Port conflict resolution commands are documented
- [ ] `npm run dev:clean` is mentioned

### Command to verify:
```bash
grep -i "troubleshooting" README.md
```

Expected output should show:
```
### Development Troubleshooting
```

## 4. VS Code Configuration Verification

### Check .vscode/launch.json
- [ ] File exists at `./.vscode/launch.json`
- [ ] URL is set to `http://localhost:5173`
- [ ] Port is set to `9222`

### Command to verify:
```bash
grep -A 5 "url.*5173" .vscode/launch.json
```

Expected output should show:
```json
"url": "http://localhost:5173",
```

## 5. Error Handling Components Verification

### Check ErrorBoundary component
- [ ] File exists at `./src/components/ErrorBoundary.tsx`
- [ ] Component renders error UI in development
- [ ] Component shows technical details in development

### Command to verify:
```bash
ls src/components/ErrorBoundary.tsx
```

Expected output should show:
```
src/components/ErrorBoundary.tsx
```

### Check App.tsx integration
- [ ] ErrorBoundary is imported in App.tsx
- [ ] App content is wrapped with ErrorBoundary

### Command to verify:
```bash
grep -n "ErrorBoundary" src/App.tsx
```

Expected output should show:
```
import ErrorBoundary from "./components/ErrorBoundary";
...
<ErrorBoundary>
...
</ErrorBoundary>
```

## 6. Developer Experience Files Verification

### Check DEV_CHECKLIST.md
- [ ] File exists at `./DEV_CHECKLIST.md`
- [ ] Contains port troubleshooting information
- [ ] Contains debugger management information

### Command to verify:
```bash
ls DEV_CHECKLIST.md
```

Expected output should show:
```
DEV_CHECKLIST.md
```

### Check smoke test scripts
- [ ] `scripts/smoke-test.js` exists
- [ ] `scripts/verify-dev-server.js` exists
- [ ] `scripts/test-dev-fixes.cjs` exists

### Command to verify:
```bash
ls scripts/smoke-test.js scripts/verify-dev-server.js scripts/test-dev-fixes.cjs
```

Expected output should show:
```
scripts/smoke-test.js
scripts/test-dev-fixes.cjs
scripts/verify-dev-server.js
```

## 7. Manual Testing

### Test preflight script
- [ ] Run `npm run dev:preflight`
- [ ] Script completes without errors

### Test dev server start
- [ ] Run `npm run dev`
- [ ] Server starts successfully
- [ ] Local URL is printed (http://localhost:5173)
- [ ] Network URL is printed

### Test dev:clean script
- [ ] Run `npm run dev:clean`
- [ ] Script attempts to start server (will timeout)
- [ ] No port conflict errors

### Test browser access
- [ ] Open browser to http://localhost:5173
- [ ] Page loads without blank screen
- [ ] No console errors
- [ ] Root element exists in DOM

## 8. Port Conflict Resolution Testing

### Test port conflict resolution (Windows)
- [ ] Run `netstat -ano | findstr :5173`
- [ ] Get PID from output
- [ ] Run `tasklist /FI "PID eq <PID>"`
- [ ] Run `taskkill /F /PID <PID>`

### Test automatic port resolution
- [ ] Start dev server on port 5173
- [ ] Start another dev server
- [ ] Second server should start on port 5174

## 9. Verification Script Testing

### Run verification script
- [ ] Run `node scripts/test-dev-fixes.cjs`
- [ ] All checks should pass
- [ ] No errors should be reported

## 10. Final Verification

### Run smoke test
- [ ] Run `npm test:smoke`
- [ ] Test should complete (may timeout but show server started)

### Check all documentation
- [ ] `DEV-SERVER-FIXES.md` exists
- [ ] `DEV-SERVER-FIX-APPLIED.md` exists
- [ ] All documentation is up to date

## Acceptance Criteria

All of the following must be true:

✅ Vite configuration updated for better port handling
✅ Preflight scripts added for automatic port cleanup
✅ README documentation updated with troubleshooting guide
✅ VS Code configuration updated to prevent conflicts
✅ ErrorBoundary component added for better error handling
✅ Developer experience files created (checklists, scripts)
✅ Manual testing completed successfully
✅ Port conflict resolution verified
✅ Verification scripts pass all checks
✅ All documentation files created and up to date

## Notes

- This checklist should be completed after applying all dev server fixes
- If any step fails, review the corresponding fix and reapply
- Keep this checklist updated as new fixes are applied
- Use this checklist for future verification of dev server reliability