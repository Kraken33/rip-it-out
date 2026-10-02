# Proposal

## Why

GitHub Pages branch-based deployments only support serving static assets from either the root (`/`) or `/docs` directory. Vite defaults to building into `dist/`, which cannot be served directly by standard GitHub Pages branch configurations. Configuring the build output to `docs/` enables seamless deployment directly from the repository's `/docs` folder.

## What Changes

- Configure `vite.config.js` build output directory (`build.outDir`) to `docs` with `emptyOutDir: true`.
- Update `.gitignore` to ensure `docs/` is tracked while ignoring obsolete/temporary build folders if applicable.
- Clean up any legacy tracked `dist/` artifacts and produce a fresh build into `docs/`.
- Document GitHub Pages configuration pointing to `/docs` folder under repository settings.

## Capabilities

### New Capabilities

<!-- Pure tooling/deployment configuration: no spec-level user-facing behavioral requirements are added. -->

### Modified Capabilities

<!-- No existing behavioral capability requirements are changing. -->

## Impact

- **Build Configuration**: `vite.config.js` will output production bundles to `docs/`.
- **Version Control**: `docs/` directory will be tracked in git containing the static build.
- **Deployment**: GitHub Pages can be configured to serve from the `/docs` folder on the main branch.
