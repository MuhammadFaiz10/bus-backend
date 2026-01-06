import type { Context } from "hono";
import { z } from "zod";
import { HonoEnv } from "../../types/app";
import { signJwt } from "../../utils/jwt";
import crypto from "node:crypto";

const registerSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string().min(6),
});
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});
const updateProfileSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
});
const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(6),
});

function hashPassword(pw: string) {
  return crypto.createHash("sha256").update(pw).digest("hex");
}

export async function registerHandler(c: Context<HonoEnv>) {
  const prisma = c.get('prisma');
  const body = await c.req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

  const { name, email, password } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return c.json({ error: "Email already registered" }, 400);

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

export async function loginHandler(c: Context<HonoEnv>) {
  const prisma = c.get('prisma');
  const body = await c.req.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return c.json({ error: "Invalid credentials" }, 401);

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

/**
 * GET /auth/me - Get current user profile
 */
export async function getMeHandler(c: Context) {
  const jwtUser = (c as any).user;
  const user = await prisma.user.findUnique({
    where: { id: jwtUser.sub },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });
  if (!user) return c.json({ error: "User not found" }, 404);
  return c.json(user);
}

/**
 * PUT /auth/me - Update current user profile
 */
export async function updateMeHandler(c: Context) {
  const jwtUser = (c as any).user;
  const body = await c.req.json();
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

  const { name, email } = parsed.data;

  // Check if email is being changed and if it's already taken
  if (email && email !== jwtUser.email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return c.json({ error: "Email already in use" }, 400);
  }

  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (email !== undefined) updateData.email = email;

  const user = await prisma.user.update({
    where: { id: jwtUser.sub },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  return c.json(user);
}

/**
 * PUT /auth/change-password - Change password
 */
export async function changePasswordHandler(c: Context) {
  const jwtUser = (c as any).user;
  const body = await c.req.json();
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

  const { currentPassword, newPassword } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: jwtUser.sub } });
  if (!user) return c.json({ error: "User not found" }, 404);

  // Verify current password
  if (user.password !== hashPassword(currentPassword)) {
    return c.json({ error: "Current password is incorrect" }, 400);
  }

  // Update password
  await prisma.user.update({
    where: { id: jwtUser.sub },
    data: { password: hashPassword(newPassword) },
  });

  return c.json({ success: true, message: "Password changed successfully" });
}
