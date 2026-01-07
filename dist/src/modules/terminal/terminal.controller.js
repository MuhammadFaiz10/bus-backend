import { z } from "zod";
const createTerminalSchema = z.object({
    code: z.string().min(3),
    name: z.string().min(3),
    city: z.string().min(3),
    type: z.enum(["TERMINAL", "STATION", "POOL"]).default("TERMINAL"),
});
export async function getAllTerminalsHandler(c) {
    const prisma = c.get("prisma");
    const terminals = await prisma.terminal.findMany({
        orderBy: { city: "asc" },
    });
    return c.json(terminals);
}
export async function createTerminalHandler(c) {
    const prisma = c.get("prisma");
    const body = await c.req.json();
    const parsed = createTerminalSchema.safeParse(body);
    if (!parsed.success) {
        return c.json({ error: parsed.error.issues }, 400);
    }
    try {
        const terminal = await prisma.terminal.create({
            data: parsed.data,
        });
        return c.json(terminal, 201);
    }
    catch (err) {
        // Unique constraint on code
        if (err.code === "P2002") {
            return c.json({ error: "Terminal code already exists" }, 409);
        }
        return c.json({ error: "Failed to create terminal" }, 500);
    }
}
