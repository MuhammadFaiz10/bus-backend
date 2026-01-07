import { createBookingSchema, changeSeatSchema } from "./booking.schema";
export async function createBookingHandler(c) {
    const prisma = c.get("prisma");
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
        // 1. Fetch seats first (Read)
        const seats = await prisma.seat.findMany({
            where: {
                tripId,
                seatCode: { in: seatCodes },
                isBooked: false,
            },
        });
        if (seats.length !== seatCodes.length) {
            return c.json({ error: "Some seats are already taken" }, 400);
        }
        // 2. Perform Bucket/Batch Transaction (Write)
        // We use nested writes to create Booking, BookingSeats, and Payment in one go if possible,
        // or standard batching.
        // For Booking -> BookingSeat and Booking -> Payment, we can use nested create.
        const bookingId = crypto.randomUUID(); // Optional: generate ID client-side or let Prisma, but for "ref" we rely on return.
        // Actually, Prisma create return value is accessible.
        // But inside $transaction array, we can't depend on previous result.
        // So we use Nested Writes for the dependencies.
        const [booking, _seatsUpdate] = await prisma.$transaction([
            prisma.booking.create({
                data: {
                    userId: user.sub,
                    tripId,
                    status: "PENDING",
                    totalPrice,
                    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
                    seats: {
                        create: seats.map((s) => ({ seatId: s.id })),
                    },
                    payment: {
                        create: {
                            // We need bookingId for orderId?
                            // Usually we do `BOOK-<id>`.
                            // Prisma nested create allows accessing parent ID? No easily.
                            // Workaround: Use a known UUID or update it later?
                            // Or just use a random orderId now and sync it?
                            // "orderId" is required.
                            // "bookingId" is inferred.
                            // Let's generate a UUID for booking manually to form the OrderID?
                            // Prisma allows providing ID.
                            id: crypto.randomUUID(), // Payment ID
                            orderId: `BOOK-${Date.now()}-${Math.floor(Math.random() * 1000)}`, // temporary, or we use a UUID
                            amount: totalPrice,
                            status: "PENDING",
                        },
                    },
                },
                include: { payment: true },
            }),
            prisma.seat.updateMany({
                where: { id: { in: seats.map((s) => s.id) } },
                data: { isBooked: true },
            }),
        ]);
        // We might want to standardize the orderId to BOOK-{booking.id}.
        // Since we didn't have booking.id before creating, we used a timestamp based one.
        // That is acceptable for Midtrans.
        return c.json({
            ...booking,
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
    const prisma = c.get("prisma");
    const user = c.user;
    const q = c.req.query();
    const page = Number(q.page) || 1;
    const perPage = Math.min(Number(q.perPage) || 20, 100);
    const status = q.status;
    const where = { userId: user.sub };
    if (status) {
        where.status = status;
    }
    const [total, data] = await Promise.all([
        prisma.booking.count({ where }),
        prisma.booking.findMany({
            where,
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
    const prisma = c.get("prisma");
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
    const prisma = c.get("prisma");
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
    const prisma = c.get("prisma");
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
    // 1. Get seat IDs explicitly (Read)
    const seatIds = booking.seats.map((s) => s.seatId);
    // 2. Batch Transaction (Write)
    await prisma.$transaction([
        // update booking
        prisma.booking.update({ where: { id }, data: { status: "CANCELLED" } }),
        // delete bookingSeat
        prisma.bookingSeat.deleteMany({ where: { bookingId: id } }),
        // free seats
        prisma.seat.updateMany({
            where: { id: { in: seatIds } },
            data: { isBooked: false },
        }),
        // mark payment failed
        prisma.payment.updateMany({
            where: { bookingId: id },
            data: { status: "FAILED" },
        }),
    ]);
    return c.json({ success: true });
}
/**
 * PUT /booking/:id/seat
 * Change seats for an existing booking.
 * Constraints:
 * - Same trip only.
 * - Same number of seats (1-to-1 swap).
 * - Target seats must be available.
 */
export async function changeSeatHandler(c) {
    const prisma = c.get("prisma");
    const id = c.req.param("id");
    const user = c.user;
    const body = await c.req.json();
    const parsed = changeSeatSchema.safeParse(body);
    if (!parsed.success)
        return c.json({ error: parsed.error.issues }, 400);
    const { newSeatCodes } = parsed.data;
    // 1. Fetch Booking
    const booking = await prisma.booking.findUnique({
        where: { id },
        include: { seats: true, trip: true },
    });
    if (!booking)
        return c.json({ error: "Booking not found" }, 404);
    // 2. Authorization Check (User owns booking or is Admin)
    // Assuming 'user' object has role. If simple user, must match sub.
    if (user.role !== "ADMIN" && booking.userId !== user.sub) {
        return c.json({ error: "Unauthorized" }, 403);
    }
    // 3. Status Check
    if (["CANCELLED", "EXPIRED", "FAILED"].includes(booking.status)) {
        return c.json({ error: "Cannot change seats for cancelled/expired booking" }, 400);
    }
    // 4. Validate Seat Count
    if (newSeatCodes.length !== booking.seats.length) {
        return c.json({
            error: `You must select exactly ${booking.seats.length} seats to swap.`,
        }, 400);
    }
    // 5. Check Availability of New Seats on SAME Trip
    const tripId = booking.tripId;
    const newSeats = await prisma.seat.findMany({
        where: {
            tripId,
            seatCode: { in: newSeatCodes },
            isBooked: false,
        },
    });
    if (newSeats.length !== newSeatCodes.length) {
        return c.json({ error: "One or more selected seats are not available." }, 400);
    }
    // 6. Execute Transaction
    try {
        const oldSeatIds = booking.seats.map((s) => s.seatId);
        const newSeatIds = newSeats.map((s) => s.id);
        await prisma.$transaction([
            // A. Unbook old seats
            prisma.seat.updateMany({
                where: { id: { in: oldSeatIds } },
                data: { isBooked: false },
            }),
            // B. Delete old BookingSeat relations
            prisma.bookingSeat.deleteMany({
                where: { bookingId: id },
            }),
            // C. Book new seats
            prisma.seat.updateMany({
                where: { id: { in: newSeatIds } },
                data: { isBooked: true },
            }),
            // D. Create new BookingSeat relations
            prisma.bookingSeat.createMany({
                data: newSeatIds.map((seatId) => ({
                    bookingId: id,
                    seatId,
                })),
            }),
        ]);
        return c.json({ success: true, message: "Seats changed successfully." });
    }
    catch (e) {
        return c.json({ error: e.message || "Failed to change seats" }, 500);
    }
}
