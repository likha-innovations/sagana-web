# Troubleshooting & FAQ

Common questions, troubleshooting steps, and operational guidelines for Sagana Web.

## Frequently Asked Questions

### Why does the page display a spinner upon reload?

When the application loads, `AuthContext` verifies your active session with Clerk and concurrently queries the backend `/me` endpoint to confirm your database role. The spinner displays momentarily while these checks resolve.

### Where did the Superadmin dashboard go?

The platform consolidated the administrative layer into a single `admin` role. All monitoring and telemetry controls are hosted under `/admin`.

### Can operators sign in to the web console?

Operators are intended to access the platform via the Sagana Mobile application. Attempting to access `/admin` with an operator account will not load administrative views.

## Common Issues & Solutions

### Missing Clerk Publishable Key

- **Symptom**: Console error stating `Missing publishableKey`.
- **Solution**: Ensure `VITE_CLERK_PUBLISHABLE_KEY` is defined in `.env` and restart the Vite dev server.

### Backend Network Refusal

- **Symptom**: Console logs show `Failed to fetch DB user profile from /me`.
- **Solution**: Confirm that the backend API server is running on the URL matching `VITE_BACKEND_URL` (default: `http://localhost:3000`).
