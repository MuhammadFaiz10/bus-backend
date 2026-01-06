# Deployment Validation Process

This document outlines the comprehensive validation process for ensuring seamless hosting of both the API and frontend components on the Cloudflare Worker platform.

## Validation Script

A robust validation script is available to automate the verification process:

```bash
npm run validate
```

This script performs the following checks:

## 1. Infrastructure Verification

### Steps
1.  **System Requirements**: Checks Node.js version (Recommended: v18/v20, Compatible: v22+).
2.  **Tooling**: Verifies `wrangler` is installed and accessible.
3.  **Configuration**: Validates `wrangler.jsonc` existence and content:
    *   Ensures `compatibility_date` is set.
    *   **Success Criterion**: `assets` configuration is present (enabling Frontend hosting).

### Identified Issues & Solutions
*   **Issue**: Node.js version mismatch.
    *   **Solution**: Use `nvm` to switch to a supported LTS version (e.g., `nvm use 20`) if strictly required, though newer versions usually work with `nodejs_compat`.

## 2. Frontend Hosting Validation

### Steps
1.  **Dependency Check**: Ensures `admin-frontend/node_modules` exists; installs if missing.
2.  **Build Process**: Runs `npm run build` in `admin-frontend`.
3.  **Output Verification**: Checks for the existence of `admin-dist/index.html`.
4.  **Asset Configuration**: Confirms `wrangler.jsonc` points to the correct `admin-dist` directory.

### Success Criteria
*   `admin-dist` directory is created.
*   `index.html` exists in the build output.
*   Wrangler is configured to serve assets from `admin-dist`.

## 3. API Hosting Validation

### Steps
1.  **Local Simulation**: Starts a local Worker instance using `wrangler dev`.
2.  **Health Check**: Requests `GET /health` to verify API responsiveness.
3.  **Endpoint Availability**:
    *   Verifies OpenAPI documentation at `/docs/openapi.yaml`.
    *   Checks public routes (e.g., `/public/routes`).

### Success Criteria
*   `/health` returns `200 OK` with status JSON.
*   `/docs/openapi.yaml` returns valid YAML content.
*   API logs show successful startup.

## 4. Integration Testing (Frontend + API)

### Steps
1.  **Root Serving**: Requests `GET /` to ensure the Frontend is served instead of a 404 or API 404.
    *   *Note*: Cloudflare Assets take precedence over Worker routes.
2.  **CORS Configuration**: The API is configured with `cors()` middleware to allow cross-origin requests (essential if frontend and backend were on different domains, but good practice even on same-domain for development).

### Success Criteria
*   `GET /` returns HTML content (Frontend).
*   API requests from the Frontend (running locally or in production) succeed.

## 5. Monitoring and Logging

### Steps
1.  **Observability**: Checks `wrangler.jsonc` for `observability` settings.
2.  **Log Collection**: Verifies `head_sampling_rate` is set to `1` (100%) for full trace capture during initial deployment.

### Recommended Monitoring
*   **Health Endpoint**: Monitor `https://<your-worker>.workers.dev/health`.
*   **Cloudflare Dashboard**: Use **Workers & Pages > Observability** to view logs and traces.

## Running the Validation

To run the full validation suite before deployment:

```bash
npm run validate
```

If all checks pass (`✨ All validations completed successfully!`), the application is ready for deployment:

```bash
npm run deploy
```
