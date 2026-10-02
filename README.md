# Rip It Out — Language Learning Prompt Orchestrator

Turn reading and listening into speaking practice with guided prompts for LLMs and spaced repetition (SM-2).

## Tech Stack

- **React 19 + Vite**
- **Tailwind CSS v4**
- **Vitest + React Testing Library**
- **Zero backend**: Local persistence with optional Supabase sync

## Development

```bash
# Install dependencies
npm install

# Start local dev server
npm run dev

# Run unit tests
npm run test

# Run linter
npm run lint

# Build for production (outputs to docs/)
npm run build
```

## GitHub Pages Deployment

This repository is configured to deploy directly to GitHub Pages from the `/docs` directory:

1. Build the production assets:
   ```bash
   npm run build
   ```
2. Commit and push the generated `docs/` folder to the `main` branch.
3. In your GitHub repository settings:
   - Navigate to **Settings** > **Pages**.
   - Under **Build and deployment** > **Source**, select **Deploy from a branch**.
   - Choose the `main` branch and select `/docs` as the folder.
   - Click **Save**.

