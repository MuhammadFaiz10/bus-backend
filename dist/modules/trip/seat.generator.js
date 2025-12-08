import { prisma } from "../../config/database";
export async function generateSeatsForTrip(tripId, layout = {
    rows: 10,
    cols: 4,
}) {
    const { rows, cols, prefix = "" } = layout;
    const seats = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 1; c <= cols; c++) {
            const code = `${String.fromCharCode(65 + r)}${c}`; // A1, A2...
            seats.push({ tripId, seatCode: `${prefix}${code}` });
        }
    }
    await prisma.seat.createMany({ data: seats });
}
