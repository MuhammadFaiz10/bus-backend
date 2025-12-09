import { z } from "zod";
import { prisma } from "../../config/database";
import { signJwt } from "../../utils/jwt";
import crypto from "crypto";
const registerSchema = z.object({
    name: z.string(),
    email: z.string().email(),
    password: z.string().min(6),
});
const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});
function hashPassword(pw) {
    return crypto.createHash("sha256").update(pw).digest("hex");
}
export async function registerHandler(c) {
    const body = await c.req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success)
        return c.json({ error: parsed.error.issues }, 400);
    const { name, email, password } = parsed.data;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing)
        return c.json({ error: "Email already registered" }, 400);
    const user = await prisma.user.create({
        data: { name, email, password: hashPassword(password) },
    });
    const token = await signJwt({
        sub: user.id,
        email: user.email,
        role: user.role,
    });
    return c.json({
        token,
        user: { id: user.id, name: user.name, email: user.email },
    });
}
export async function loginHandler(c) {
    const body = await c.req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success)
        return c.json({ error: parsed.error.issues }, 400);
    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
        return c.json({ error: "Invalid credentials" }, 401);
    if (user.password !== hashPassword(password))
        return c.json({ error: "Invalid credentials" }, 401);
    const token = await signJwt({
        sub: user.id,
        email: user.email,
        role: user.role,
    });
    return c.json({
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
}
