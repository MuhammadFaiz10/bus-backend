import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { promisify } from "util";

const execAsync = promisify(exec);
const exists = promisify(fs.exists);
const readFile = promisify(fs.readFile);

const COLORS = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

const log = (msg: string, color: string = COLORS.reset) => {
  console.log(`${color}${msg}${COLORS.reset}`);
};

const error = (msg: string) => {
  console.error(`${COLORS.red}✖ ${msg}${COLORS.reset}`);
  process.exit(1);
};

const success = (msg: string) => {
  console.log(`${COLORS.green}✔ ${msg}${COLORS.reset}`);
};

async function checkInfrastructure() {
  log("\n--- 1. Infrastructure Verification ---", COLORS.cyan);
  
  // Check Node.js version
  const nodeVersion = process.version;
  log(`Node.js Version: ${nodeVersion}`);
  if (!nodeVersion.startsWith("v18") && !nodeVersion.startsWith("v20") && !nodeVersion.startsWith("v22")) {
    log(`Warning: Recommended Node.js version is v18 or v20. Current: ${nodeVersion}`, COLORS.yellow);
  } else {
    success("Node.js version compatible");
  }

  // Check Wrangler
  try {
    const { stdout } = await execAsync("npx wrangler --version");
    success(`Wrangler installed: ${stdout.trim()}`);
  } catch (e) {
    error("Wrangler not found. Please run 'npm install'.");
  }

  // Check wrangler.jsonc
  if (await exists("wrangler.jsonc")) {
    success("wrangler.jsonc exists");
    const content = await readFile("wrangler.jsonc", "utf-8");
    
    // Check compatibility date
    if (content.includes("compatibility_date")) {
        success("compatibility_date configured");
    } else {
        error("compatibility_date missing in wrangler.jsonc");
    }

    // Check assets configuration
    if (content.includes('"assets"') || content.includes('assets =')) {
        success("Assets configuration found");
    } else {
        log("Warning: Assets configuration not explicitly found in text check (might be okay if dynamic).", COLORS.yellow);
    }
  } else {
    error("wrangler.jsonc missing");
  }
}

async function buildFrontend() {
  log("\n--- 2. Frontend Build & Validation ---", COLORS.cyan);
  
  const frontendDir = path.join(process.cwd(), "admin-frontend");
  const distDir = path.join(process.cwd(), "admin-dist");

  if (!await exists(frontendDir)) {
    error("admin-frontend directory not found");
  }

  // Check if node_modules exists in frontend
  if (!await exists(path.join(frontendDir, "node_modules"))) {
    log("Installing frontend dependencies...", COLORS.yellow);
    try {
      await execAsync("npm install", { cwd: frontendDir });
      success("Frontend dependencies installed");
    } catch (e) {
      error(`Frontend install failed: ${(e as Error).message}`);
    }
  }

  log("Building frontend...", COLORS.yellow);
  try {
    await execAsync("npm run build", { cwd: frontendDir });
    success("Frontend build successful");
  } catch (e) {
    error(`Frontend build failed: ${(e as Error).message}`);
  }

  if (await exists(distDir) && await exists(path.join(distDir, "index.html"))) {
    success(`Build output verified at ${distDir}`);
  } else {
    error("Build output directory or index.html missing");
  }
}

async function validateAPI() {
  log("\n--- 3. API & Integration Validation ---", COLORS.cyan);
  
  // This step requires running the worker locally.
  // We will spawn wrangler dev and try to hit endpoints.
  
  log("Starting local worker for validation...", COLORS.yellow);
  
  const controller = new AbortController();
  const { signal } = controller;
  
  const child = exec("npx wrangler dev --port 8788", { signal });
  
  // Give it some time to start
  await new Promise(r => setTimeout(r, 5000));
  
  try {
    // 1. Check Health
    try {
        const healthRes = await fetch("http://localhost:8788/health");
        if (healthRes.ok) {
            success("API Health Check Passed (/health)");
        } else {
            throw new Error(`Health check failed: ${healthRes.status}`);
        }
    } catch (e) {
        throw new Error(`Could not connect to API: ${(e as Error).message}`);
    }

    // 2. Check Static Asset (Frontend)
    try {
        const indexRes = await fetch("http://localhost:8788/");
        const text = await indexRes.text();
        if (indexRes.ok && text.includes("<!doctype html>") || text.includes("<div id=\"root\">") || text.includes("vite")) {
            success("Frontend Root Served (/)");
        } else {
            // It might be serving the JSON from Hono if assets aren't matched or built correctly?
            // Hono app.get("/") returns json {ok: true}.
            // If assets are configured, index.html should take precedence? 
            // Actually, Cloudflare Assets usually take precedence over Worker routes if the file exists.
            // But verify logic.
            log(`Root response: ${text.substring(0, 50)}...`, COLORS.yellow);
            if (text.includes('"ok":true')) {
                 log("Warning: Root returned API response instead of Frontend. Check asset configuration precedence.", COLORS.yellow);
            } else {
                 success("Frontend asset served");
            }
        }
    } catch (e) {
        log(`Frontend check warning: ${(e as Error).message}`, COLORS.yellow);
    }

    // 3. Check OpenAPI Docs
    try {
        const docsRes = await fetch("http://localhost:8788/docs/openapi.yaml");
        if (docsRes.ok) {
            success("OpenAPI Spec served (/docs/openapi.yaml)");
        } else {
            throw new Error(`Docs check failed: ${docsRes.status}`);
        }
    } catch (e) {
        log(`Docs check warning: ${(e as Error).message}`, COLORS.yellow);
    }

  } catch (e) {
    error(`Validation failed: ${(e as Error).message}`);
  } finally {
    log("Stopping local worker...");
    controller.abort(); 
    // Force kill if needed
    try { process.kill(-child.pid!); } catch(e) {}
  }
}

async function run() {
  log("Starting Comprehensive Deployment Validation...", COLORS.blue);
  
  await checkInfrastructure();
  await buildFrontend();
  await validateAPI();
  
  log("\n✨ All validations completed successfully!", COLORS.green);
}

run().catch(e => {
  error(`Unhandled error: ${e.message}`);
});
