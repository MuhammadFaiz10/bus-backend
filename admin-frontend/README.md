
# Admin Dashboard (React + Vite)

This is a minimal admin dashboard that integrates with your Hono backend.

## Quick start

1. Install dependencies:
   ```
   cd admin
   npm install
   ```

2. Start dev server:
   ```
   npm run dev
   ```

3. Build for production (build output placed in `../admin-dist`):
   ```
   npm run build
   ```

4. To serve via backend, build and then serve `admin-dist` files from backend root (app configured to serve /admin-dashboard).

## Notes
- Configure `VITE_API_BASE_URL` in `.env` in admin folder or rely on relative paths.
- Login uses `/auth/login` endpoint. Ensure backend running.
