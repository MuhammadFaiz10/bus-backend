import app from "./app";
import dotenv from "dotenv";
dotenv.config();
import { PORT } from "./config/env";
import { cleanupExpiredBookings } from "./utils/cron";

app.fire();
console.log(`Listening on port ${PORT}`);

import { getPrisma } from "./config/database";
const prisma = getPrisma({} as any);

// optional: simple interval to cleanup expired bookings
setInterval(() => {
  cleanupExpiredBookings(prisma).catch((e) => console.error("cron err", e));
}, 60 * 1000);
