import { Context } from "hono";
import { prisma } from "../../config/database";

export async function createBookingHandler(c: Context) {
  const body = await c.req.json();
  const { tripId, seatCodes } = body as { tripId: string; seatCodes: string[] };
  const user = (c as any).user;
  if (!tripId || !seatCodes || seatCodes.length === 0)
    return c.json({ error: "Bad request" }, 400);

  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip) return c.json({ error: "Trip not found" }, 404);
  const totalPrice = trip.price * seatCodes.length;

  try {
    const booking = await prisma.$transaction(async (tx) => {
      // Lock seats FOR UPDATE (matching tripId + seatCode and isBooked = false)
      const seats = await tx.$queryRawUnsafe(
        `SELECT * FROM "Seat" WHERE "tripId" = $1 AND "seatCode" = ANY($2) AND "isBooked" = false FOR UPDATE`,
        tripId,
        seatCodes
      );

      if ((seats as any[]).length !== seatCodes.length)
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

      for (const s of seats as any[]) {
        await tx.bookingSeat.create({
          data: { bookingId: b.id, seatId: s.id },
        });
      }

      await tx.payment.create({
        data: { bookingId: b.id, orderId: `BOOK-${b.id}`, amount: totalPrice },
      });

      return b;
    });

    return c.json({
      booking,
      message: "Booking created. Please proceed to payment.",
    });
  } catch (err: any) {
    return c.json({ error: err.message || "Cannot create booking" }, 400);
  }
}
