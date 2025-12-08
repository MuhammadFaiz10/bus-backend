export function requireRole(role) {
    return async (c, next) => {
        const user = c.user;
        if (!user)
            return c.json({ error: "Unauthorized" }, 401);
        if (user.role !== role)
            return c.json({ error: "Forbidden" }, 403);
        await next();
    };
}
