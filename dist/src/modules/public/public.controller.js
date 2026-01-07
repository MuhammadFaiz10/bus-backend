/**
 * GET /public/routes
 */
export async function listRoutesHandler(c) {
    const prisma = c.get('prisma');
    const routes = await prisma.route.findMany({
        orderBy: { createdAt: "desc" },
    });
    return c.json(routes);
}
/**
 * GET /public/buses
 */
export async function listBusesHandler(c) {
    const prisma = c.get('prisma');
    const buses = await prisma.bus.findMany({ orderBy: { createdAt: "desc" } });
    return c.json(buses);
}
/**
 * GET /public/trips
 * optional query: from, to, date (YYYY-MM-DD)
 */
export async function listTripsHandler(c) {
    const prisma = c.get('prisma');
    const q = c.req.query();
    const where = {};
    if (q.from)
        where.route = { origin: { contains: q.from } };
    if (q.to)
        where.route = { destination: { contains: q.to } };
    if (q.date) {
        const d = new Date(q.date);
        const start = new Date(d);
        start.setHours(0, 0, 0, 0);
        const end = new Date(d);
        end.setHours(23, 59, 59, 999);
        where.departureTime = { gte: start, lte: end };
    }
    const trips = await prisma.trip.findMany({
        where,
        include: { bus: true, route: true },
        orderBy: { departureTime: "asc" },
    });
    return c.json(trips);
}
/**
 * GET /public/trips/:id
 * Returns trip + seat layout + seat availability
 */
export async function tripDetailHandler(c) {
    const prisma = c.get('prisma');
    const id = c.req.param("id");
    if (!id)
        return c.json({ error: "Bad request" }, 400);
    const trip = await prisma.trip.findUnique({
        where: { id },
        include: {
            bus: true,
            route: true,
            seats: true,
            bookings: { include: { payment: true } },
        },
    });
    if (!trip)
        return c.json({ error: "Trip not found" }, 404);
    // Build seat map: seatCode + isBooked
    const seats = trip.seats.map((s) => ({
        id: s.id,
        seatCode: s.seatCode,
        isBooked: s.isBooked,
    }));
    return c.json({
        trip: {
            id: trip.id,
            bus: trip.bus,
            route: trip.route,
            departureTime: trip.departureTime,
            arrivalTime: trip.arrivalTime,
            price: trip.price,
        },
        seats,
    });
}
