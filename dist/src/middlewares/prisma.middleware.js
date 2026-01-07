import { getPrisma } from '../config/database';
export const prismaMiddleware = async (c, next) => {
    const prisma = getPrisma(c.env);
    c.set('prisma', prisma);
    await next();
};
