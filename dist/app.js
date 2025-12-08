import { Hono } from "hono";
import authRouter from "./modules/auth/auth.route";
import bookingRouter from "./modules/booking/booking.route";
import paymentRouter from "./modules/payment/payment.route";
import adminRouter from "./modules/admin/admin.route";
import docsRouter from "./docs/docs.route";
const app = new Hono();
// Documentation
app.route("/docs", docsRouter);
// User & public-facing APIs
app.route("/auth", authRouter);
app.route("/booking", bookingRouter);
app.route("/payment", paymentRouter);
// Admin dashboard APIs (protected by admin middleware)
app.route("/admin", adminRouter);
app.get("/", (c) => c.json({ ok: true }));
export default app;
