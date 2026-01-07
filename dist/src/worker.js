import app from "./app";
import { getPrisma } from "./config/database";
import { cleanupExpiredBookings } from "./utils/cron";
export default {
    fetch: app.fetch,
    async scheduled(event, env, ctx) {
        console.log("⏰ Cron job started");
        const prisma = getPrisma(env);
        ctx.waitUntil(cleanupExpiredBookings(prisma));
        console.log("✅ Cron job scheduled");
    },
};
