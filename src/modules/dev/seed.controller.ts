import { Context } from "hono";
import { HonoEnv } from "../../types/app";
import crypto from "node:crypto";

function hash(pw: string) {
  return crypto.createHash("sha256").update(pw).digest("hex");
}

export async function seedHandler(c: Context<HonoEnv>) {
  const prisma = c.get('prisma');

  console.log("🌱 Seeding database...");

  try {
    // ---------------------------
    // USERS
    // ---------------------------
    // Check if admin exists to avoid duplicates
    const existingAdmin = await prisma.user.findUnique({ where: { email: "admin@test.com" } });
    if (!existingAdmin) {
        await prisma.user.create({
            data: {
                name: "Admin",
                email: "admin@test.com",
                password: hash("password123"),
                role: "ADMIN",
            },
        });
        console.log("✓ Admin inserted");
    } else {
        console.log("✓ Admin already exists");
    }

    const existingUser1 = await prisma.user.findUnique({ where: { email: "user1@test.com" } });
    if (!existingUser1) {
        await prisma.user.create({
            data: {
                name: "User One",
                email: "user1@test.com",
                password: hash("password123"),
                role: "USER",
            },
        });
        console.log("✓ User1 inserted");
    }

    // ---------------------------
    // BUSES
    // ---------------------------
    const busA = await prisma.bus.upsert({
        where: { plate: "B 7777 AB" },
        update: {},
        create: {
            name: "Bus Eksekutif A",
            plate: "B 7777 AB",
            totalSeat: 40,
        }
    });

    const busB = await prisma.bus.upsert({
        where: { plate: "D 1234 BB" },
        update: {},
        create: {
            name: "Bus Ekonomi B",
            plate: "D 1234 BB",
            totalSeat: 32,
        }
    });

    console.log("✓ Buses inserted");

    // ---------------------------
    // ROUTES
    // ---------------------------
    // Since Route doesn't have unique constraint other than ID, we might create duplicates if we are not careful.
    // For simplicity in this seed, we'll check by finding first.
    let routeJakartaBandung = await prisma.route.findFirst({ where: { origin: "Jakarta", destination: "Bandung" } });
    if (!routeJakartaBandung) {
        routeJakartaBandung = await prisma.route.create({
            data: {
                origin: "Jakarta",
                destination: "Bandung",
                distanceKm: 150,
            },
        });
    }

    let routeBandungJogja = await prisma.route.findFirst({ where: { origin: "Bandung", destination: "Yogyakarta" } });
    if (!routeBandungJogja) {
        routeBandungJogja = await prisma.route.create({
            data: {
                origin: "Bandung",
                destination: "Yogyakarta",
                distanceKm: 350,
            },
        });
    }

    console.log("✓ Routes inserted");

    // ---------------------------
    // TRIPS
    // ---------------------------
    const now = new Date();
    
    // Cleanup old trips for demo purposes if needed, or just add new ones.
    // We'll just add new ones for today.
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
    async function generateSeats(tripId: string, rows = 10, cols = 4) {
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

    return c.json({ success: true, message: "Database seeded successfully" });

  } catch (e) {
    console.error(e);
    return c.json({ error: (e as Error).message }, 500);
  }
}
