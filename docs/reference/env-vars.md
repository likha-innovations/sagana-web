# Environment Variables Schema

Reference for environment configuration variables required by Sagana Web.

## Required Variables

| Variable | Description | Example Format |
|---|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk authentication publishable frontend API key | `pk_test_...` |
| `VITE_BACKEND_URL` | Base URL of the backend API service | `http://localhost:3000` |

## Setup Instructions

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Populate the keys with your project credentials.
3. Restart the development server (`pnpm dev`) for changes to take effect.

## Security Directives

- Never commit `.env` or files containing live credentials to version control.
- Inspect and verify variable names only from `.env.example`.
- Do not output credentials or tokens in console logs.
