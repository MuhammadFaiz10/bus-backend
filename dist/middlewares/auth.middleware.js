import { verifyJwt } from "../utils/jwt";
export const authMiddleware = async (c, next) => {
    const header = c.req.header("authorization");
    if (!header)
        return c.json({ error: "Unauthorized" }, 401);
    const token = header.replace("Bearer ", "");
    try {
        const payload = await verifyJwt(token);
        c.user = payload;
        await next();
    }
    catch (err) {
        return c.json({ error: "Invalid token" }, 401);
    }
};
export const adminOnly = async (c, next) => {
    const user = c.user;
    if (!user || user.role !== "ADMIN")
        return c.json({ error: "Forbidden" }, 403);
    await next();
};
