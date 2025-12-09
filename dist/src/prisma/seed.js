import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
const prisma = new PrismaClient();
function hash(pw) {
    return crypto.createHash("sha256").update(pw).digest("hex");
}
async function main() {
    console.log("🌱 Seeding database...");
    // ---------------------------
    // USERS
    // ---------------------------
    const admin = await prisma.user.create({
        data: {
            name: "Admin",
            email: "admin@test.com",
            password: hash("password123"),
            role: "ADMIN",
        },
    });
    const user1 = await prisma.user.create({
        data: {
            name: "User One",
            email: "user1@test.com",
            password: hash("password123"),
            role: "USER",
        },
    });
    const user2 = await prisma.user.create({
        data: {
            name: "User Two",
            email: "user2@test.com",
            password: hash("password123"),
            role: "USER",
        },
    });
    console.log("✓ Users inserted");
    // ---------------------------
    // BUSES
    // ---------------------------
    const busA = await prisma.bus.create({
        data: {
            name: "Bus Eksekutif A",
            plate: "B 7777 AB",
            totalSeat: 40,
        },
    });
    const busB = await prisma.bus.create({
        data: {
            name: "Bus Ekonomi B",
            plate: "D 1234 BB",
            totalSeat: 32,
        },
    });
    console.log("✓ Buses inserted");
    // ---------------------------
    // ROUTES
    // ---------------------------
    const routeJakartaBandung = await prisma.route.create({
        data: {
            origin: "Jakarta",
            destination: "Bandung",
            distanceKm: 150,
        },
    });
    const routeBandungJogja = await prisma.route.create({
        data: {
            origin: "Bandung",
            destination: "Yogyakarta",
            distanceKm: 350,
        },
    });
    console.log("✓ Routes inserted");
    // ---------------------------
    // TRIPS WITH AUTO-SEATS
    // ---------------------------
    const now = new Date();
    const trip1 = await prisma.trip.create({
        data: {
            busId: busA.id,
            routeId: routeJakartaBandung.id,
            departureTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0),
            arrivalTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0),
            price: 120000,
        },
    });
    const trip2 = await prisma.trip.create({
        data: {
            busId: busB.id,
            routeId: routeBandungJogja.id,
            departureTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0),
            arrivalTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 0),
            price: 200000,
        },
    });
    console.log("✓ Trips inserted");
    // ---------------------------
    // GENERATE SEATS
    // ---------------------------
    async function generateSeats(tripId, rows = 10, cols = 4) {
        const seats = [];
        for (let r = 0; r < rows; r++) {
            for (let c = 1; c <= cols; c++) {
                seats.push({
                    tripId,
                    seatCode: `${String.fromCharCode(65 + r)}${c}`,
                });
            }
        }
        await prisma.seat.createMany({ data: seats });
    }
    await generateSeats(trip1.id);
    await generateSeats(trip2.id);
    console.log("✓ Seats generated");
    console.log("🌱 Seeder completed!");
}
main()
    .then(() => prisma.$disconnect())
    .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
});
