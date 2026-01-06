import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
// import { serveStatic } from "@hono/node-server/serve-static";
import { prismaMiddleware } from "./middlewares/prisma.middleware";
import { HonoEnv } from "./types/app";

import authRouter from "./modules/auth/auth.route";
import bookingRouter from "./modules/booking/booking.route";
import publicRouter from "./modules/public/public.route";
import paymentRouter from "./modules/payment/payment.route";
import adminRouter from "./modules/admin/admin.route";
import devRouter from "./modules/dev/dev.route";
import docsRouter from "./docs/docs.route";

const app = new Hono<HonoEnv>();

// Global Middlewares
app.use('*', logger());
app.use('*', cors());
app.use('*', prismaMiddleware); // Inject Prisma into context

// Documentation
app.route("/docs", docsRouter);

// Dev tools
app.route("/dev", devRouter);

// User & public-facing APIs
app.route("/public", publicRouter);
app.route("/auth", authRouter);
app.route("/booking", bookingRouter);
app.route("/payment", paymentRouter);

// Admin dashboard APIs (protected by admin middleware)
app.route("/admin", adminRouter);

// Admin dashboard static files
// app.use("/admin-dashboard/*", serveStatic({ root: "./admin-dist" }));
// app.get("/admin-dashboard/*", serveStatic({ root: "./admin-dist/index.html" }));

// app.get("/", (c) => c.json({ ok: true }));
app.get("/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));

// SPA Fallback - Serve index.html for any unknown route
app.get("*", async (c) => {
  if (c.env.ASSETS) {
    const res = await c.env.ASSETS.fetch(new URL("/index.html", c.req.url));
    return res as unknown as Response;
  }
  return c.text("Not Found", 404);
});

export default app;
