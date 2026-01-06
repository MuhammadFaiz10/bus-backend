# Deployment Strategy: Bus Booking Backend on Cloudflare Workers (JSONC Config)

This plan outlines the steps to deploy the application to Cloudflare Workers using **JSONC** for configuration, ensuring maintainability and validation.

## 1. Project Configuration (JSONC)
We will transition the project to Cloudflare Workers using the flexible `wrangler.jsonc` format.

- **Dependencies**:
  - Install `wrangler`, `@cloudflare/workers-types`, `@prisma/adapter-d1`.
  - Add `jsonc-parser` or similar if needed for custom validation scripts, though Wrangler supports `.jsonc` natively.
- **Configuration (`wrangler.jsonc`)**:
  - Create `wrangler.jsonc` with extensive comments explaining each setting.
  - Define:
    - `name`, `main`, `compatibility_date`.
    - `d1_databases` binding.
    - `vars` for environment configuration.
    - `observability` settings.
- **Validation Script**:
  - Create `scripts/validate-config.ts` to programmatically verify `wrangler.jsonc` structure (e.g., ensuring `d1_databases` is present and `main` points to a valid file) before deployment.

## 2. D1 Database Integration & Refactoring
To enable D1, we must refactor the application's data access layer to be "Worker-compatible" (removing global state).

- **Prisma + D1 Adapter**:
  - Update `schema.prisma` to use `sqlite` and `driverAdapters`.
  - Generate SQL migrations using `prisma migrate diff`.
- **Dependency Injection (Critical Refactor)**:
  - **Remove Global Prisma**: Delete the global instance in `src/config/database.ts`.
  - **Context-Based Instance**: Create a factory function `getPrisma(env)` that initializes Prisma with the D1 binding from the request context.
  - **Middleware**: Implement a Hono middleware to inject `prisma` into `c.env` or `c.var` for every request.
  - **Controller Updates**: Refactor **ALL** controllers to access the database via the request context (e.g., `c.var.prisma.booking.create(...)`).

## 3. Worker Implementation
- **Entry Point (`src/worker.ts`)**:
  - Create a new entry point that exports the standard Worker interface (`fetch`, `scheduled`).
  - Integrate the Hono app and the new Prisma middleware.
- **Health Check**:
  - Add a `/health` endpoint for deployment verification.

## 4. Deployment Pipeline & Verification
- **CI/CD Workflow (`.github/workflows/deploy.yml`)**:
  - **Build**: Compile TypeScript.
  - **Validate**: Run `scripts/validate-config.ts`.
  - **Migrate**: Execute `wrangler d1 migrations apply`.
  - **Deploy**: Run `wrangler deploy -c wrangler.jsonc`.
  - **Verify**: Add a step to `curl` the deployed `/health` endpoint and assert a 200 OK response.
- **Error Handling**:
  - Configure the pipeline to fail fast on validation errors.
  - Use `try/catch` blocks in the validation script to provide clear, actionable error messages (e.g., "Missing D1 binding in wrangler.jsonc").

## 5. Documentation
- **Schema Documentation**: Include a `CONFIG_SCHEMA.md` or detailed comments within `wrangler.jsonc` describing expected fields and values.

## Implementation Order
1.  **Setup**: Install dependencies, create `wrangler.jsonc` and validation script.
2.  **Refactor**: Modify database config, entry point, and apply Dependency Injection across all modules.
3.  **Database**: Setup D1 and migrations.
4.  **Pipeline**: Create GitHub Action with verification steps.
