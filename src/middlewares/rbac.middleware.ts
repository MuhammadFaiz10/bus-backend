import type { Context, Next } from "hono";
import { prisma } from "../config/database";

/**
 * requireRole: require a role (ADMIN or USER)
 */
export function requireRole(role: "ADMIN" | "USER") {
  return async (c: Context, next: Next) => {
    const user = (c as any).user;
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    if (user.role !== role && user.role !== "ADMIN")
      // ADMIN can do user actions too
      return c.json({ error: "Forbidden" }, 403);
    await next();
  };
}

/**
 * requireOwner: requires that the current user is owner of resource
 * Use: requireOwner('booking', 'bookingIdParamName')
 * It assumes resource has userId field (booking.userId)
 */
export function requireOwner(resource: "booking", paramName = "id") {
  return async (c: Context, next: Next) => {
    const user = (c as any).user;
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const id = c.req.param(paramName);
    if (!id) return c.json({ error: "Bad Request" }, 400);

    if ((user as any).role === "ADMIN") {
      // admin bypass
      await next();
      return;
    }

    if (resource === "booking") {
      const booking = await prisma.booking.findUnique({ where: { id } });
      if (!booking) return c.json({ error: "Not found" }, 404);
      if (booking.userId !== (user as any).sub)
        return c.json({ error: "Forbidden" }, 403);
    }

    await next();
  };
}
