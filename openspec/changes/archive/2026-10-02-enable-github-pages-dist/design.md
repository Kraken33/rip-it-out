# Design

## Context

See `proposal.md` for motivation. Currently, the repository ignores `dist/` via `.gitignore` and `vite.config.js` uses Vite's default root base path (`'/'`). The application uses React Router's `HashRouter`, which is already compatible with static file hosting on GitHub Pages without requiring server-side fallback rewriting.

## Goals / Non-Goals

**Goals:**
- Enable tracking and committing the production build folder (`dist/`) in Git.
- Configure Vite (`base: './'`) so bundled asset references (scripts, stylesheets, icons) are relative and work regardless of the GitHub Pages repository path or domain.
- Verify that `npm run build` succeeds and produces clean assets in `dist/`.

**Non-Goals:**
- Modifying application runtime logic or state management.
- Complex CI/CD automation pipelines (the target approach is repository/dist-based GitHub Pages publishing).

## Decisions

### Decision 1: Relative Base URL in Vite Config (`base: './'`)
- **Rationale**: Setting `base: './'` in `vite.config.js` ensures generated HTML script and link tags use relative paths (`./assets/...`), allowing the site to load properly whether hosted at `https://<user>.github.io/<repo>/` or a custom root domain.
- **Alternatives Considered**:
  - Hardcoding `base: '/rip-it-out/'`: Works for a specific repo name, but breaks if repo is renamed or deployed to a custom domain.
  - Default `base: '/'`: Fails on standard GitHub Pages project sites because it resolves assets to root domain `https://<user>.github.io/assets/...`.

### Decision 2: Update `.gitignore` to allow `dist/` tracking
- **Rationale**: Removing `dist` and `dist-ssr` from `.gitignore` allows Git to track the compiled production files in `dist/`.
- **Alternatives Considered**:
  - `git add -f dist`: Forcing git add each time is error-prone and easy to forget during routine builds.

## Risks / Trade-offs

- **[Risk]** Binary/minified bundle churn in Git history on every build.
  - **Mitigation**: Run `npm run build` before pushing release commits.
- **[Risk]** Stale build files remaining if source files are deleted or renamed.
  - **Mitigation**: Vite empties the `dist/` directory by default on each build (`emptyOutDir: true`).
