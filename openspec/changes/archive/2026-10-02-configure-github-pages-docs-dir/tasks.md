# Tasks

## 1. Build and Output Configuration

- [x] 1.1 Update `vite.config.js` to set `build.outDir: 'docs'` and `build.emptyOutDir: true` while preserving `base: './'`, and verify `npm run build` outputs assets to `docs/`.
- [x] 1.2 Update `.gitignore` to track `docs/` and ignore `dist/`, removing any legacy tracked `dist/` files so that only `docs/` is staged.

## 2. Verification and Documentation

- [x] 2.1 Run test and build validation (`npm run test`, `npm run lint`, `npm run build`) to verify that the build succeeds and `docs/index.html` exists with valid relative asset paths.
- [x] 2.2 Update `README.md` with GitHub Pages setup instructions (selecting "Deploy from a branch" with `/docs` directory) and verify documentation clarity.
