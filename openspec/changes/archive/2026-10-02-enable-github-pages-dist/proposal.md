# Proposal

## Why

To host the application directly on GitHub Pages using the built production assets in the repository, the built output directory (`dist/`) needs to be tracked by Git and configured properly with relative asset base paths in Vite.

## What Changes

- Update `.gitignore` to remove `dist` and `dist-ssr` from the ignore list (or explicitly allow `dist/` tracking).
- Configure Vite's `base` path in `vite.config.js` to support GitHub Pages repository subpaths (e.g. `./` relative paths).
- Build the production assets into `dist/` and stage/track them in Git for GitHub Pages deployment.
- Provide clear deployment instructions for GitHub Pages settings (Deploy from branch / root or /dist folder or custom branch).

## Capabilities

### New Capabilities
<!-- Pure tooling/deployment configuration: no spec-level user-facing behavioral requirements are added. -->

### Modified Capabilities
<!-- No existing behavioral capability requirements are changing. -->

## Impact

- **Build / Packaging**: `vite.config.js` will output relative asset links (`base: './'`).
- **Version Control**: `dist/` directory and its generated static bundle assets will be tracked in git.
- **Hosting**: The application will be deployable and functional when served from GitHub Pages.
