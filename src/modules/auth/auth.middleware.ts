import type { Context, Next } from "hono";
import { verifyJwt } from "../../utils/jwt";

export const authMiddleware = async (c: Context, next: Next) => {
  const header = c.req.header("authorization");
  if (!header) return c.json({ error: "Unauthorized" }, 401);

  const token = header.replace("Bearer ", "");
  try {
    const payload = await verifyJwt(token);
    (c as any).user = payload;
    await next();
  } catch (err) {
    return c.json({ error: "Invalid token" }, 401);
  }
};

export const adminOnly = async (c: Context, next: Next) => {
  const user = (c as any).user;
  if (!user || (user as any).role !== "ADMIN")
    return c.json({ error: "Forbidden" }, 403);
  await next();
};
