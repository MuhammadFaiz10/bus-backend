# Deployment Guide: Bus Backend on Cloudflare Workers

This guide details the deployment process for the Bus Booking Backend using Cloudflare Workers and D1 Database.

## Prerequisites

- Node.js v20+
- Cloudflare Account
- Wrangler CLI (`npm install -g wrangler`)

## Configuration

The project uses **JSONC** (JSON with Comments) for configuration management.

### `wrangler.jsonc`

Located at the project root, this file configures the Worker.

```jsonc
{
  "name": "bus-backend",
  "main": "src/worker.ts", // Entry point
  "compatibility_date": "2024-04-05",
  "d1_databases": [
    {
      "binding": "DB", // The variable name in code (env.DB)
      "database_name": "bus-db",
      "database_id": "REPLACE_WITH_YOUR_D1_DATABASE_ID" // MUST BE UPDATED
    }
  ],
  "vars": {
    "ENVIRONMENT": "production"
  }
}
```

### Secrets

Sensitive variables must be set using `wrangler secret put`:

```bash
wrangler secret put JWT_PRIVATE_KEY
wrangler secret put MIDTRANS_SERVER_KEY
wrangler secret put MIDTRANS_CLIENT_KEY
wrangler secret put MIDTRANS_IS_PRODUCTION
```

## Database Setup (Cloudflare D1)

1. **Create a Database**:
   ```bash
   npx wrangler d1 create bus-db
   ```
2. **Update Config**:
   Copy the `database_id` from the output and paste it into `wrangler.jsonc`.

3. **Apply Migrations**:
   The project uses Prisma to manage the schema (`prisma/schema.prisma`).
   
   First, generate the SQL migration file (if changed):
   ```bash
   npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > migrations/0001_init.sql
   ```

   Then apply it to the remote D1 database:
   ```bash
   npx wrangler d1 migrations apply bus-db --remote
   ```

## Local Development

To run locally with a local D1 emulator:

```bash
npx wrangler dev
```

## Deployment

1. **Validate Configuration**:
   ```bash
   npx tsx scripts/validate-config.ts
   ```

2. **Deploy**:
   ```bash
   npx wrangler deploy -c wrangler.jsonc
   ```

3. **Verify**:
   Visit `https://<your-worker>.workers.dev/health` to confirm the service is running.

## CI/CD (GitHub Actions)

A workflow is provided in `.github/workflows/deploy.yml`.
Ensure you set the following Repository Secrets in GitHub:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

## Architecture Notes

- **Dependency Injection**: The global `prisma` instance has been removed. Access `prisma` via the Hono Context: `c.get('prisma')`.
- **Cron Jobs**: Scheduled tasks (like booking expiration) are handled by the `scheduled` export in `src/worker.ts`.
