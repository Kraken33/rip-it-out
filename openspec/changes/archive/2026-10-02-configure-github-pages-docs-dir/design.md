# Design

## Context

GitHub Pages branch-based hosting supports two source directory options: root (`/`) and `/docs`. Vite projects output to `dist/` by default. To deploy via the GitHub Pages `/docs` branch setting without introducing GitHub Actions CI pipelines, the build pipeline must output static assets into `docs/`.

## Goals / Non-Goals

**Goals:**
- Configure Vite (`vite.config.js`) to output build artifacts to `docs/`.
- Maintain relative asset URL resolution (`base: './'`).
- Ensure `docs/` is tracked in git and `dist/` is cleaned up / ignored.
- Verify production build generates valid static assets in `docs/`.

**Non-Goals:**
- Custom GitHub Actions CI/CD workflows (standard branch deployment is used).
- Application runtime or business logic changes.

## Decisions

### Decision: Target `docs/` directory for Vite production builds
- **Rationale**: GitHub Pages natively supports serving static sites from `/docs` folder on any branch. Pointing Vite's `build.outDir` to `docs` allows direct commits of build artifacts that GitHub Pages serves immediately.
- **Alternatives Considered**:
  - *Deploy from root (`/`)*: Overwriting source files (like root `index.html`) during build creates conflicts between source code and generated bundles.
  - *Deploy via GitHub Actions*: Adds CI workflow configuration and token permissions; branch deployment from `/docs` is simpler and self-contained.

### Decision: Update `.gitignore` and clean up `dist/`
- **Rationale**: `dist/` is no longer the active deployment directory. Removing tracked files in `dist/` and adding `dist/` to `.gitignore` prevents confusion and keeps the repository clean.
- **Alternatives Considered**:
  - *Keeping both `dist/` and `docs/`*: Leads to redundant duplicate build files and possible desynchronization.

## Risks / Trade-offs

- **[Risk: Committing build artifacts can increase repo size over time]** → *Mitigation*: Asset bundles for this app are small (<1MB compressed) and do not contain heavy binary assets.
- **[Risk: Forgetting to run build before pushing changes]** → *Mitigation*: Document the build step clearly in the README/workflow.
