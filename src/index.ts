import { serve } from "@hono/node-server";
import app from "./app";
import dotenv from "dotenv";
import { PORT } from "./config/env";
import { cleanupExpiredBookings } from "./utils/cron";

dotenv.config();

serve({
  fetch: app.fetch,
  port: Number(PORT) || 3000,
  hostname: "0.0.0.0",
});

console.log(`🚀 Server running on http://localhost:${PORT || 3000}`);
console.log(`📚 Swagger UI available at http://localhost:${PORT || 3000}/docs`);

// Optional: simple interval to cleanup expired bookings
setInterval(() => {
  cleanupExpiredBookings().catch((e) => console.error("cron err", e));
}, 60 * 1000);
