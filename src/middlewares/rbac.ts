import type { Context, Next } from "hono";

export function requireRole(role: "ADMIN" | "USER") {
  return async (c: Context, next: Next) => {
    const user = (c as any).user;
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    if (user.role !== role) return c.json({ error: "Forbidden" }, 403);
    await next();
  };
}
