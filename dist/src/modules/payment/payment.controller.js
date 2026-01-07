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
        // Use a robust unique Order ID.
        // If we want to allow retries, we might need a timestamp component if the previous one failed?
        // But for Snap, keeping it consistent allows resuming.
        // However, if we change params, we need new ID.
        // Let's stick to BOOK-{id} for now, but handle potential error if Midtrans complains.
        // Actually, to be safe against "Duplicate Order ID" for failed attempts that Midtrans remembers as 'failed' (cannot reuse),
        // we should validly use the one from DB if it exists and looks valid, OR generate new one.
        // For now, let's keep it simple: BOOK-{id}-{timestamp} to ensure unicity on every attempt?
        // No, that creates spam.
        // Let's rely on BOOK-{id} but wrap in try-catch.
        // Better: Check if we already have a Snap token in DB?
        // The previous code overwrote it.
        // Let's try to generate unique OrderID every time to avoid "Duplicate Order ID" if previous attempt failed/expired.
        const orderId = `BOOK-${booking.id}-${Math.floor(Date.now() / 1000)}`;
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
