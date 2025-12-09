import { prisma } from "../config/database";
export async function cleanupExpiredBookings() {
    const expired = await prisma.booking.findMany({
        where: { status: "PENDING", expiresAt: { lt: new Date() } },
    });
    if (expired.length === 0)
        return;
    await prisma.$transaction(async (tx) => {
        for (const b of expired) {
            await tx.booking.update({
                where: { id: b.id },
                data: { status: "EXPIRED" },
            });
            const bs = await tx.bookingSeat.findMany({ where: { bookingId: b.id } });
            const seatIds = bs.map((s) => s.seatId);
            await tx.bookingSeat.deleteMany({ where: { bookingId: b.id } });
            await tx.seat.updateMany({
                where: { id: { in: seatIds } },
                data: { isBooked: false },
            });
        }
    });
}
