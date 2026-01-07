import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";
export const getPrisma = (env) => {
    // If running in Cloudflare Workers with D1
    if (env?.DB) {
        const adapter = new PrismaD1(env.DB);
        return new PrismaClient({ adapter });
    }
    // Fallback for local development (Node.js)
    return new PrismaClient();
};
