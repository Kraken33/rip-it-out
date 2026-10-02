# Tasks

## 1. Configuration Updates

- [x] 1.1 Update `.gitignore` to remove `dist` and `dist-ssr` so that build output is tracked by Git, and verify `git check-ignore -v dist` does not match.
- [x] 1.2 Configure `base: './'` in `vite.config.js` to support relative asset loading for GitHub Pages, and verify configuration syntax.

## 2. Build and Verification

- [x] 2.1 Run test suite via `npm run test` and verify that all test suites continue to pass.
- [x] 2.2 Run `npm run build` to generate the production bundle and verify `dist/index.html` references assets using relative paths (`./assets/...`).
- [x] 2.3 Verify `dist/` files are visible in `git status` and ready for tracking in the repository.
