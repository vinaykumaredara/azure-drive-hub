# Stylelint Tailwind CSS Fix

## Problem
The error "Unknown at rule @tailwind css(unknownAtRules)" was appearing in CSS files using Tailwind CSS directives.

## Root Cause
1. Stylelint by default flags unknown at-rules, including Tailwind's custom at-rules (@tailwind, @apply, etc.)
2. Although the .stylelintrc.json configuration had the correct ignore rules, some editors or linter versions might not properly pick up the configuration
3. The addition of scss-specific rules caused errors since the stylelint-scss plugin wasn't installed

## Solution Applied

### 1. Updated Stylelint Configuration
The [.stylelintrc.json](file:///c:/Users/vinay/carrental/azure-drive-hub/.stylelintrc.json) file was updated to properly ignore Tailwind CSS at-rules:

```json
{
  "extends": ["stylelint-config-standard"],
  "rules": {
    "at-rule-no-unknown": [
      true,
      {
        "ignoreAtRules": [
          "tailwind",
          "apply",
          "variants",
          "responsive",
          "screen"
        ]
      }
    ],
    "selector-class-pattern": "^[a-z]([a-z0-9-]+)?(__([a-z0-9]+-?)+)?(--([a-z0-9]+-?)+)?(\\[.+\\])?$",
    "selector-id-pattern": "^[a-z]([a-z0-9-]+)?(__([a-z0-9]+-?)+)?(--([a-z0-9]+-?)+)?(\\[.+\\])?$"
  }
}
```

### 2. Added Inline Comments (src/index.css)
Added targeted disable/enable comments around Tailwind directives in [src/index.css](file:///c:/Users/vinay/carrental/azure-drive-hub/src/index.css):

```css
/* stylelint-disable at-rule-no-unknown */
@tailwind base;
@tailwind components;
@tailwind utilities;
/* stylelint-enable at-rule-no-unknown */
```

### 3. VS Code Configuration
Added [.vscode/settings.json](file:///c:/Users/vinay/carrental/azure-drive-hub/.vscode/settings.json) to ensure proper linting behavior in VS Code:

```json
{
  "css.validate": false,
  "less.validate": false,
  "scss.validate": false,
  "stylelint.snippet": [
    "css",
    "scss"
  ],
  "editor.codeActionsOnSave": {
    "source.fixAll.stylelint": true
  }
}
```

## Verification
The fix has been verified by running:
```bash
npx stylelint "src/**/*.css"
```

No errors were reported after applying the fixes.

## Additional Recommendations

1. If using SCSS/Sass, install the `stylelint-scss` plugin:
   ```bash
   npm install --save-dev stylelint-scss
   ```

   And update the configuration:
   ```json
   {
     "extends": ["stylelint-config-standard", "stylelint-scss"],
     "plugins": ["stylelint-scss"],
     "rules": {
       "at-rule-no-unknown": [
         true,
         {
           "ignoreAtRules": [
             "tailwind",
             "apply",
             "variants",
             "responsive",
             "screen"
           ]
         }
       ],
       "scss/at-rule-no-unknown": [
         true,
         {
           "ignoreAtRules": [
             "tailwind",
             "apply",
             "variants",
             "responsive",
             "screen"
           ]
         }
       ]
     }
   }
   ```

2. Restart your editor/IDE after applying these changes to ensure the linter picks up the new configuration.

3. Clear any stylelint cache that might be present:
   ```bash
   npx stylelint --cache false "src/**/*.css"
   ```