import app from "./app";
import dotenv from "dotenv";
dotenv.config();
import { PORT } from "./config/env";
import { cleanupExpiredBookings } from "./utils/cron";

app.fire();
console.log(`Listening on port ${PORT}`);

// optional: simple interval to cleanup expired bookings
setInterval(() => {
  cleanupExpiredBookings().catch((e) => console.error("cron err", e));
}, 60 * 1000);
