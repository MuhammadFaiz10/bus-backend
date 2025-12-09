import { Context } from "hono";
import { prisma } from "../../config/database";
import { createTransaction } from "./midtrans.client";

export async function createPaymentHandler(c: Context) {
  const body = await c.req.json();
  const { bookingId } = body;
  const user = (c as any).user;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { payment: true },
  });
  if (!booking) return c.json({ error: "Booking not found" }, 404);
  if (booking.userId !== user.sub) return c.json({ error: "Forbidden" }, 403);
  if (booking.status !== "PENDING")
    return c.json({ error: "Booking is not pending" }, 400);

  const orderId = `BOOK-${booking.id}`;
  const mid = await createTransaction(orderId, booking.totalPrice, {
    first_name: user.email,
    email: user.email,
  });

  await prisma.payment.update({
    where: { bookingId: booking.id },
    data: { rawResponse: mid, orderId, amount: booking.totalPrice },
  });

  return c.json({ payment: mid });
}

export async function midtransWebhookHandler(c: Context) {
  const body = await c.req.json();
  const orderId = body.order_id;
  const status = body.transaction_status;

  if (!orderId) return c.json({ error: "No order_id" }, 400);

  const payment = await prisma.payment.findUnique({ where: { orderId } });
  if (!payment) return c.json({ error: "Payment not found" }, 404);

  if (status === "settlement" || status === "capture") {
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { orderId },
        data: {
          status: "PAID",
          transactionId: body.transaction_id || null,
          rawResponse: body,
        } as any,
      });
      await tx.booking.update({
        where: { id: payment.bookingId },
        data: { status: "CONFIRMED" },
      });
      const bs = await tx.bookingSeat.findMany({
        where: { bookingId: payment.bookingId },
      });
      const seatIds = bs.map((b) => b.seatId);
      await tx.seat.updateMany({
        where: { id: { in: seatIds } },
        data: { isBooked: true },
      });
    });
  } else if (status === "deny" || status === "cancel" || status === "expire") {
    await prisma.payment.update({
      where: { orderId },
      data: { status: "FAILED", rawResponse: body } as any,
    });
    await prisma.booking.update({
      where: { id: payment.bookingId },
      data: { status: "EXPIRED" },
    });
  }

  return c.json({ success: true });
}

export async function getMyPaymentsHandler(c: Context) {
  const user = (c as any).user;
  const payments = await prisma.payment.findMany({
    where: { booking: { userId: user.sub } },
    include: { booking: true },
    orderBy: { createdAt: "desc" },
  });
  return c.json(payments);
}
