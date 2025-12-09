import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
import authRouter from "./modules/auth/auth.route";
import bookingRouter from "./modules/booking/booking.route";
import publicRouter from "./modules/public/public.route";
import paymentRouter from "./modules/payment/payment.route";
import adminRouter from "./modules/admin/admin.route";
import docsRouter from "./docs/docs.route";
const app = new Hono();
// Documentation
app.route("/docs", docsRouter);
// User & public-facing APIs
app.route("/public", publicRouter);
app.route("/auth", authRouter);
app.route("/booking", bookingRouter);
app.route("/payment", paymentRouter);
// Admin dashboard APIs (protected by admin middleware)
app.route("/admin", adminRouter);
// Admin dashboard static files
app.use("/admin-dashboard/*", serveStatic({ root: "./admin-dist" }));
app.get("/admin-dashboard/*", serveStatic({ root: "./admin-dist/index.html" }));
app.get("/", (c) => c.json({ ok: true }));
export default app;
