import { Context } from "hono";
import { HonoEnv } from "../../types/app";
import {
  createUserSchema,
  promoteUserSchema,
  createBusSchema,
  updateBusSchema,
  createRouteSchema,
  updateRouteSchema,
  createTripSchema,
  updateTripSchema,
} from "./admin.schema";
import crypto from "node:crypto";

/**
 * Helpers
 */
function parseDate(q: any, key: string) {
  if (!q[key]) return null;
  const d = new Date(q[key]);
  if (isNaN(d.getTime())) return null;
  return d;
}

/**
 * Revenue handlers
 */
export async function dailyRevenueHandler(c: Context<HonoEnv>) {
  const prisma = c.get("prisma");
  const q = c.req.query();
  const day = parseDate(q, "date") || new Date();
  const start = new Date(day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(day);
  end.setHours(23, 59, 59, 999);

  const res = await prisma.payment.aggregate({
    where: { status: "PAID", createdAt: { gte: start, lte: end } },
    _sum: { amount: true },
  });

  return c.json({ date: start.toISOString(), revenue: res._sum.amount || 0 });
}

export async function monthlyRevenueHandler(c: Context<HonoEnv>) {
  const prisma = c.get("prisma");
  const q = c.req.query();
  const y = Number(q.year) || new Date().getFullYear();
  const m = Number(q.month) ? Number(q.month) - 1 : new Date().getMonth();
  const start = new Date(y, m, 1);
  const end = new Date(y, m + 1, 1);
  const res = await prisma.payment.aggregate({
    where: { status: "PAID", createdAt: { gte: start, lt: end } },
    _sum: { amount: true },
  });
  return c.json({ year: y, month: m + 1, revenue: res._sum.amount || 0 });
}

export async function revenueByRouteHandler(c: Context<HonoEnv>) {
  const prisma = c.get("prisma");
  const rows = await prisma.$queryRawUnsafe(`
    SELECT r.id as route_id, r.origin, r.destination, SUM(p.amount) as revenue
    FROM "Route" r
    JOIN "Trip" t ON t."routeId" = r.id
    JOIN "Booking" b ON b."tripId" = t.id
    JOIN "Payment" p ON p."bookingId" = b.id AND p.status = 'PAID'
    GROUP BY r.id, r.origin, r.destination
    ORDER BY revenue DESC
    LIMIT 100
  `);

  return c.json(rows);
}

export async function revenueByBusHandler(c: Context<HonoEnv>) {
  const prisma = c.get("prisma");
  const rows = await prisma.$queryRawUnsafe(`
    SELECT bus.id as bus_id, bus.name, bus.plate, SUM(p.amount) as revenue
    FROM "Bus" bus
    JOIN "Trip" t ON t."busId" = bus.id
    JOIN "Booking" b ON b."tripId" = t.id
    JOIN "Payment" p ON p."bookingId" = b.id AND p.status = 'PAID'
    GROUP BY bus.id, bus.name, bus.plate
    ORDER BY revenue DESC
    LIMIT 100
  `);
  return c.json(rows);
}

/**
 * Bookings list (paginated + filters)
 * query params: page, perPage, status, from, to, routeId, tripId
 */
export async function paginatedBookingsHandler(c: Context<HonoEnv>) {
  const prisma = c.get("prisma");
  const q = c.req.query();
  const page = Number(q.page) || 1;
  const perPage = Math.min(Number(q.perPage) || 20, 100);
  const status = q.status as any;
  const from = parseDate(q, "from");
  const to = parseDate(q, "to");

  const where: any = {};
  if (status) where.status = status;
  if (q.routeId) where.trip = { routeId: q.routeId };
  if (q.tripId) where.tripId = q.tripId;
  if (from || to) where.createdAt = {};
  if (from) where.createdAt.gte = from;
  if (to) where.createdAt.lte = to;

  const [total, data] = await Promise.all([
    prisma.booking.count({ where }),
    prisma.booking.findMany({
      where,
      include: {
        user: true,
        trip: { include: { bus: true, route: true } },
        seats: { include: { seat: true } },
        payment: true,
      },
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return c.json({ page, perPage, total, data });
}

export async function bookingStatsHandler(c: Context<HonoEnv>) {
  const prisma = c.get("prisma");
  const total = await prisma.booking.count();
  const counts = await prisma.booking.groupBy({
    by: ["status"],
    _count: { status: true },
  });
  return c.json({ total, counts });
}

export async function confirmBookingHandler(c: Context<HonoEnv>) {
  const prisma = c.get("prisma");
  const id = c.req.param("id");

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { seats: true, payment: true },
  });

  if (!booking) return c.json({ error: "Booking not found" }, 404);

  if (booking.status === "CONFIRMED") {
    return c.json({ error: "Booking is already confirmed" }, 400);
  }

  // Transaction to update booking, payment, and seats
  await prisma.$transaction([
    prisma.booking.update({
      where: { id },
      data: { status: "CONFIRMED" },
    }),
    prisma.payment.updateMany({
      where: { bookingId: id },
      data: { status: "PAID", transactionId: "MANUAL-ADMIN" },
    }),
    prisma.seat.updateMany({
      where: { id: { in: booking.seats.map((s) => s.seatId) } },
      data: { isBooked: true },
    }),
  ]);

  return c.json({ success: true, message: "Booking confirmed manually" });
}

/**
 * Admin user management
 */
export async function createUserHandler(c: Context<HonoEnv>) {
  const prisma = c.get("prisma");
  const body = await c.req.json();
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

  const { name, email, password, role } = parsed.data;
  const hashed = crypto.createHash("sha256").update(password).digest("hex");

  try {
    const u = await prisma.user.create({
      data: {
        name: name || "",
        email,
        password: hashed,
        role: role || "USER",
      },
    });
    return c.json(u);
  } catch (e: any) {
    return c.json({ error: e.message }, 400);
  }
}

export async function listUsersHandler(c: Context<HonoEnv>) {
  const prisma = c.get("prisma");
  const q = c.req.query();
  const page = Number(q.page) || 1;
  const perPage = Math.min(Number(q.perPage) || 50, 200);
  const [total, users] = await Promise.all([
    prisma.user.count(),
    prisma.user.findMany({
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return c.json({ page, perPage, total, users });
}

export async function promoteUserHandler(c: Context<HonoEnv>) {
  const prisma = c.get("prisma");
  const id = c.req.param("id");
  const body = await c.req.json();

  const parsed = promoteUserSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

  try {
    const u = await prisma.user.update({
      where: { id },
      data: { role: parsed.data.role },
    });
    return c.json(u);
  } catch (e: any) {
    return c.json({ error: e.message }, 400);
  }
}

/**
 * Bus CRUD
 */
export async function createBusHandler(c: Context<HonoEnv>) {
  const prisma = c.get("prisma");
  const body = await c.req.json();
  const parsed = createBusSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

  try {
    const data = await prisma.bus.create({ data: parsed.data });
    return c.json(data);
  } catch (e: any) {
    return c.json({ error: e.message }, 400);
  }
}

export async function updateBusHandler(c: Context<HonoEnv>) {
  const prisma = c.get("prisma");
  const id = c.req.param("id");
  const body = await c.req.json();
  const parsed = updateBusSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

  try {
    const data = await prisma.bus.update({
      where: { id },
      data: parsed.data,
    });
    return c.json(data);
  } catch (e: any) {
    return c.json({ error: e.message }, 400);
  }
}

export async function deleteBusHandler(c: Context<HonoEnv>) {
  const prisma = c.get("prisma");
  const id = c.req.param("id");
  try {
    await prisma.bus.delete({ where: { id } });
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 400);
  }
}

export async function listBusesHandler(c: Context<HonoEnv>) {
  const prisma = c.get("prisma");
  const buses = await prisma.bus.findMany({ orderBy: { createdAt: "desc" } });
  return c.json(buses);
}

/**
 * Route CRUD
 */
export async function createRouteHandler(c: Context<HonoEnv>) {
  const prisma = c.get("prisma");
  const body = await c.req.json();
  const parsed = createRouteSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

  try {
    const data = await prisma.route.create({ data: parsed.data });
    return c.json(data);
  } catch (e: any) {
    return c.json({ error: e.message }, 400);
  }
}

export async function updateRouteHandler(c: Context<HonoEnv>) {
  const prisma = c.get("prisma");
  const id = c.req.param("id");
  const body = await c.req.json();
  const parsed = updateRouteSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

  try {
    const data = await prisma.route.update({
      where: { id },
      data: parsed.data,
    });
    return c.json(data);
  } catch (e: any) {
    return c.json({ error: e.message }, 400);
  }
}

export async function deleteRouteHandler(c: Context<HonoEnv>) {
  const prisma = c.get("prisma");
  const id = c.req.param("id");
  try {
    await prisma.route.delete({ where: { id } });
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 400);
  }
}

export async function listRoutesHandler(c: Context<HonoEnv>) {
  const prisma = c.get("prisma");
  const routes = await prisma.route.findMany({
    orderBy: { createdAt: "desc" },
  });
  return c.json(routes);
}

/**
 * Trip CRUD (create auto-generate seats option)
 */
export async function createTripHandler(c: Context<HonoEnv>) {
  const prisma = c.get("prisma");
  const body = await c.req.json();
  const parsed = createTripSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

  const data = parsed.data;

  try {
    const trip = await prisma.trip.create({
      data: {
        busId: data.busId,
        routeId: data.routeId,
        departureTime: new Date(data.departureTime),
        arrivalTime: new Date(data.arrivalTime),
        price: data.price,
      },
    });

    if (data.generateSeats) {
      const rows = data.rows || 10;
      const cols = data.cols || 4;
      const seats: any[] = [];

      for (let r = 0; r < rows; r++) {
        for (let c = 1; c <= cols; c++) {
          seats.push({
            tripId: trip.id,
            seatCode: `${String.fromCharCode(65 + r)}${c}`,
          });
        }
      }

      await prisma.seat.createMany({ data: seats });
    }

    return c.json(trip);
  } catch (e: any) {
    return c.json({ error: e.message }, 400);
  }
}

export async function updateTripHandler(c: Context<HonoEnv>) {
  const prisma = c.get("prisma");
  const id = c.req.param("id");
  const body = await c.req.json();
  const parsed = updateTripSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

  try {
    const data = await prisma.trip.update({
      where: { id },
      data: {
        ...parsed.data,
        departureTime: parsed.data.departureTime
          ? new Date(parsed.data.departureTime)
          : undefined,
        arrivalTime: parsed.data.arrivalTime
          ? new Date(parsed.data.arrivalTime)
          : undefined,
      },
    });
    return c.json(data);
  } catch (e: any) {
    return c.json({ error: e.message }, 400);
  }
}

export async function deleteTripHandler(c: Context<HonoEnv>) {
  const prisma = c.get("prisma");
  const id = c.req.param("id");
  try {
    await prisma.trip.delete({ where: { id } });
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 400);
  }
}

export async function listTripsHandler(c: Context<HonoEnv>) {
  const prisma = c.get("prisma");
  const q = c.req.query();
  const trips = await prisma.trip.findMany({
    include: { bus: true, route: true, seats: true },
    orderBy: { departureTime: "desc" },
  });
  return c.json(trips);
}
