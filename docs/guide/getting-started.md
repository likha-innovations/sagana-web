# Getting Started

Quick start guide for configuring, building, and running the Sagana Web application.

## Prerequisites

- Node.js 20 or higher
- pnpm 10 or higher
- Clerk account with valid publishable keys
- Running instance of Sagana backend service

## Installation

Clone the repository and install project dependencies using `pnpm`:

```bash
git clone https://github.com/likha-innovations/sagana-web.git
cd sagana-web
pnpm install
```

## Environment Setup

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Ensure the following variables are configured in `.env`:

```sh
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY="pk_test_..."

# Backend API URL
VITE_BACKEND_URL="http://localhost:3000"
```

## Available Scripts

| Script | Purpose |
|---|---|
| `pnpm dev` | Starts Vite development server at `http://localhost:5173` |
| `pnpm build` | Compiles TypeScript (`tsc -b`) and produces production bundle |
| `pnpm lint` | Runs ESLint validation across code files |
| `pnpm preview` | Serves the generated production bundle locally |
| `pnpm docs:dev` | Launches the VitePress documentation server |
| `pnpm docs:build` | Compiles static documentation pages |
| `pnpm docs:preview` | Previews the compiled documentation build |
