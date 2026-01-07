import { createTransaction } from "./midtrans.client";
export async function createPaymentHandler(c) {
    const prisma = c.get("prisma");
    const body = await c.req.json();
    const { bookingId } = body;
    const user = c.user;
    try {
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: { payment: true },
        });
        if (!booking)
            return c.json({ error: "Booking not found" }, 404);
        if (booking.userId !== user.sub)
            return c.json({ error: "Forbidden" }, 403);
        if (booking.status !== "PENDING")
            return c.json({ error: "Booking is not pending" }, 400);
        // Midtrans limits order_id to 50 chars.
        // Booking ID is a UUID (36 chars).
        // `BOOK-${booking.id}-${timestamp}` is 5+36+1+13 = 55 chars -> TOO LONG.
        // We need a shorter unique ID.
        // Option 1: `BOOK-${booking.id.split('-')[0]}-${Date.now()}`
        // UUID first part is 8 chars. Total: 5+8+1+13 = 27 chars. Safe.
        // But is it unique enough? Yes, for the same booking.
        // And collision between different bookings with same first 8 chars? Unlikely but possible.
        // Option 2: Just slice the booking ID?
        // Option 3: Use a completely random short ID but linked in DB?
        // Let's use: `B-${booking.id.slice(0,18)}-${Math.floor(Date.now()/1000).toString(36)}`
        // booking.id slice 18: "74dd6a41-4d56-483b"
        // timestamp base36: 8 chars.
        // Total: 2 + 18 + 1 + 8 = 29 chars. Safe.
        // Simpler: `T-${booking.id.split('-').pop()}-${Date.now()}`
        // Last part of UUID is 12 chars. Date.now() is 13 chars.
        // T- + 12 + 1 + 13 = 28 chars.
        // `T-42fbef0615cc-1704619283463`
        const timestamp = Math.floor(Date.now() / 1000);
        const orderId = `B${booking.id.split("-")[0]}-${timestamp}`;
        // Example: B74dd6a41-1704619283 (19 chars). Very safe.
        // First part of UUID (8 hex chars) + timestamp (10 digits).
        // Risk: Two bookings starting with same 8 chars created at same second? Extremely low.
        // Get env vars
        const serverKey = c.env.MIDTRANS_SERVER_KEY;
        if (!serverKey)
            throw new Error("Midtrans Server Key is missing");
        const isProd = c.env.MIDTRANS_IS_PRODUCTION === "true";
        const mid = await createTransaction(serverKey, isProd, orderId, booking.totalPrice, {
            first_name: user.email,
            email: user.email,
        });
        await prisma.payment.update({
            where: { bookingId: booking.id },
            data: { rawResponse: mid, orderId, amount: booking.totalPrice },
        });
        return c.json({ payment: mid });
    }
    catch (err) {
        console.error("Payment Error:", err);
        // Extract meaningful error from Axios if possible
        const msg = err.response?.data?.error_messages?.join(", ") ||
            err.message ||
            "Payment initiation failed";
        return c.json({ error: `Failed to initiate payment: ${msg}` }, 500);
    }
}
export async function midtransWebhookHandler(c) {
    const prisma = c.get("prisma");
    const body = await c.req.json();
    const orderId = body.order_id;
    const status = body.transaction_status;
    if (!orderId)
        return c.json({ error: "No order_id" }, 400);
    const payment = await prisma.payment.findUnique({ where: { orderId } });
    if (!payment)
        return c.json({ error: "Payment not found" }, 404);
    if (status === "settlement" || status === "capture") {
        // 1. Fetch related data (Read)
        const currentPayment = await prisma.payment.findUnique({
            where: { orderId },
            include: {
                booking: {
                    include: {
                        seats: true, // include bookingSeat relations
                    },
                },
            },
        });
        if (currentPayment && currentPayment.booking) {
            const seatIds = currentPayment.booking.seats.map((bs) => bs.seatId);
            await prisma.$transaction([
                prisma.payment.update({
                    where: { orderId },
                    data: {
                        status: "PAID",
                        transactionId: body.transaction_id || null,
                        rawResponse: body,
                    },
                }),
                prisma.booking.update({
                    where: { id: payment.bookingId },
                    data: { status: "CONFIRMED" },
                }),
                prisma.seat.updateMany({
                    where: { id: { in: seatIds } },
                    data: { isBooked: true },
                }),
            ]);
        }
    }
    else if (status === "deny" || status === "cancel" || status === "expire") {
        await prisma.payment.update({
            where: { orderId },
            data: { status: "FAILED", rawResponse: body },
        });
        await prisma.booking.update({
            where: { id: payment.bookingId },
            data: { status: "EXPIRED" },
        });
    }
    return c.json({ success: true });
}
export async function getMyPaymentsHandler(c) {
    const prisma = c.get("prisma");
    const user = c.user;
    const payments = await prisma.payment.findMany({
        where: { booking: { userId: user.sub } },
        include: { booking: true },
        orderBy: { createdAt: "desc" },
    });
    return c.json(payments);
}
