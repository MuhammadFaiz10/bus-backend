import { createBookingSchema } from "./booking.schema";
export async function createBookingHandler(c) {
    const prisma = c.get('prisma');
    const body = await c.req.json();
    const parsed = createBookingSchema.safeParse(body);
    if (!parsed.success)
        return c.json({ error: parsed.error.issues }, 400);
    const { tripId, seatCodes } = parsed.data;
    const user = c.user;
    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip)
        return c.json({ error: "Trip not found" }, 404);
    const totalPrice = trip.price * seatCodes.length;
    try {
        const booking = await prisma.$transaction(async (tx) => {
            // Replaced Raw SQL with Prisma for SQLite compatibility
            const seats = await tx.seat.findMany({
                where: {
                    tripId,
                    seatCode: { in: seatCodes },
                    isBooked: false,
                },
            });
            if (seats.length !== seatCodes.length)
                throw new Error("Some seats are already taken");
            const b = await tx.booking.create({
                data: {
                    userId: user.sub,
                    tripId,
                    status: "PENDING",
                    totalPrice,
                    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
                },
            });
            for (const s of seats) {
                await tx.bookingSeat.create({
                    data: { bookingId: b.id, seatId: s.id },
                });
                // We should probably mark seat as booked here if the schema implies it, 
                // but the original code didn't update 'isBooked' to true?
                // Wait, original code:
                /*
                  // Lock seats FOR UPDATE
                  const seats = await tx.$queryRawUnsafe(...)
                  ...
                  // It creates BookingSeat.
                  // Does it update Seat.isBooked?
                */
                // Looking at original code, it creates BookingSeat. 
                // But cancel handler updates `isBooked: false`. 
                // The create handler MISSING `isBooked: true` update in the original code?
                // Let's look at `cancelBookingHandler`:
                // await tx.seat.updateMany({ where: { id: { in: seatIds } }, data: { isBooked: false } });
                // This implies seats SHOULD be marked isBooked = true when booked.
                // The original code seemingly missed this or I missed it in the read?
                // Let's check `booking.controller.ts` original read again.
                // It does NOT show `tx.seat.update(...)` in `createBookingHandler`.
                // This looks like a BUG in the original code or logic handled via `BookingSeat` existence?
                // But `cancel` explicitly sets `isBooked: false`.
                // `seat.generator` sets `isBooked: false` default.
                // If `isBooked` is never set to true, then `SELECT ... AND isBooked = false` always returns true.
                // I should probably fix this by setting `isBooked: true`.
            }
            // FIX: Mark seats as booked
            await tx.seat.updateMany({
                where: { id: { in: seats.map(s => s.id) } },
                data: { isBooked: true }
            });
            await tx.payment.create({
                data: { bookingId: b.id, orderId: `BOOK-${b.id}`, amount: totalPrice },
            });
            return b;
        });
        return c.json({
            booking,
            message: "Booking created. Please proceed to payment.",
        });
    }
    catch (err) {
        return c.json({ error: err.message || "Cannot create booking" }, 400);
    }
}
/**
 * GET /booking/me
 */
export async function getMyBookingsHandler(c) {
    const prisma = c.get('prisma');
    const user = c.user;
    const q = c.req.query();
    const page = Number(q.page) || 1;
    const perPage = Math.min(Number(q.perPage) || 20, 100);
    const [total, data] = await Promise.all([
        prisma.booking.count({ where: { userId: user.sub } }),
        prisma.booking.findMany({
            where: { userId: user.sub },
            include: {
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
/**
 * GET /booking/me/upcoming
 */
export async function upcomingBookingsHandler(c) {
    const prisma = c.get('prisma');
    const user = c.user;
    const now = new Date();
    const data = await prisma.booking.findMany({
        where: {
            userId: user.sub,
            status: "CONFIRMED",
            trip: { departureTime: { gte: now } },
        },
        include: {
            trip: { include: { bus: true, route: true } },
            seats: { include: { seat: true } },
            payment: true,
        },
        orderBy: { trip: { departureTime: "asc" } },
    });
    return c.json({ data });
}
/**
 * GET /booking/:id
 */
export async function getBookingDetailHandler(c) {
    const prisma = c.get('prisma');
    const id = c.req.param("id");
    const booking = await prisma.booking.findUnique({
        where: { id },
        include: {
            user: true,
            trip: { include: { bus: true, route: true } },
            seats: { include: { seat: true } },
            payment: true,
        },
    });
    if (!booking)
        return c.json({ error: "Not found" }, 404);
    return c.json(booking);
}
/**
 * POST /booking/:id/cancel
 * Only allow cancel if status is PENDING (or we can allow other policies)
 */
export async function cancelBookingHandler(c) {
    const prisma = c.get('prisma');
    const id = c.req.param("id");
    const booking = await prisma.booking.findUnique({
        where: { id },
        include: { seats: true },
    });
    if (!booking)
        return c.json({ error: "Not found" }, 404);
    if (booking.status !== "PENDING") {
        return c.json({ error: "Only pending bookings can be cancelled" }, 400);
    }
    await prisma.$transaction(async (tx) => {
        // update booking
        await tx.booking.update({ where: { id }, data: { status: "CANCELLED" } });
        // free seats & delete bookingSeat
        const seatIds = booking.seats.map((s) => s.seatId);
        await tx.bookingSeat.deleteMany({ where: { bookingId: id } });
        await tx.seat.updateMany({
            where: { id: { in: seatIds } },
            data: { isBooked: false },
        });
        // delete payment record (or mark failed)
        await tx.payment.updateMany({
            where: { bookingId: id },
            data: { status: "FAILED" },
        });
    });
    return c.json({ success: true });
}
