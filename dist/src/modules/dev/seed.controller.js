import crypto from "node:crypto";
function hash(pw) {
    return crypto.createHash("sha256").update(pw).digest("hex");
}
export async function seedHandler(c) {
    const prisma = c.get("prisma");
    console.log("🌱 Cleaning up database...");
    try {
        await prisma.payment.deleteMany();
        await prisma.bookingSeat.deleteMany();
        await prisma.booking.deleteMany();
        await prisma.seat.deleteMany();
        await prisma.trip.deleteMany();
        await prisma.route.deleteMany();
        await prisma.bus.deleteMany();
        await prisma.terminal.deleteMany();
        await prisma.user.deleteMany();
        console.log("✓ Database cleaned");
        console.log("🌱 Seeding database...");
        // ---------------------------
        // USERS
        // ---------------------------
        const admin = await prisma.user.create({
            data: {
                name: "Super Admin",
                email: "admin@test.com",
                password: hash("password123"),
                role: "ADMIN",
            },
        });
        const usersData = [
            {
                name: "Andi Saputra",
                email: "andi@test.com",
                phone: "081234567890",
                nim: "12345678",
            }, // With details
            { name: "Budi Santoso", email: "budi@test.com", phone: "081987654321" }, // Phone only
            { name: "Citra Lestari", email: "citra@test.com" }, // Nullable test
            { name: "Dewi Pratama", email: "dewi@test.com" },
            { name: "Eko Wahyudi", email: "eko@test.com" },
            { name: "Farhan Hakim", email: "farhan@test.com" },
        ];
        const users = await Promise.all(usersData.map((u) => prisma.user.create({
            data: {
                ...u,
                password: hash("password123"),
                role: "USER",
            },
        })));
        console.log("✓ Users inserted");
        // ---------------------------
        // BUSES (10 Buses)
        // ---------------------------
        const busesData = [
            { name: "Djawa Bus - Eksekutif", plate: "B 1234 PK", totalSeat: 32 },
            { name: "Djawa Bus - Ekonomi", plate: "B 5678 SJ", totalSeat: 40 },
            { name: "Djawa Bus - First Class", plate: "AD 1111 RI", totalSeat: 21 },
            { name: "Djawa Bus - HR Edition", plate: "K 1524 AB", totalSeat: 34 },
            { name: "Djawa Bus - Double Decker", plate: "N 7777 GH", totalSeat: 42 },
            { name: "Djawa Bus - Suite Class", plate: "B 9999 SC", totalSeat: 22 },
            { name: "Djawa Bus - Premium", plate: "D 8888 PR", totalSeat: 36 },
            {
                name: "Djawa Bus - Super Eksekutif",
                plate: "L 5555 SE",
                totalSeat: 30,
            },
            { name: "Djawa Bus - Luxury", plate: "B 4444 LX", totalSeat: 18 },
            { name: "Djawa Bus - Sleeper", plate: "H 3333 SL", totalSeat: 20 },
        ];
        const buses = await Promise.all(busesData.map((b) => prisma.bus.create({ data: b })));
        console.log("✓ 10 Buses inserted");
        // ---------------------------
        // ROUTES (20 Routes)
        // ---------------------------
        const routesData = [
            { origin: "Jakarta", destination: "Bandung", distanceKm: 150 },
            { origin: "Jakarta", destination: "Surabaya", distanceKm: 780 },
            { origin: "Semarang", destination: "Yogyakarta", distanceKm: 120 },
            { origin: "Surabaya", destination: "Malang", distanceKm: 95 },
            { origin: "Bandung", destination: "Yogyakarta", distanceKm: 350 },
            { origin: "Jakarta", destination: "Yogyakarta", distanceKm: 420 },
            { origin: "Jakarta", destination: "Semarang", distanceKm: 450 },
            { origin: "Jakarta", destination: "Solo", distanceKm: 530 },
            { origin: "Jakarta", destination: "Malang", distanceKm: 850 },
            { origin: "Bandung", destination: "Surabaya", distanceKm: 700 },
            { origin: "Surabaya", destination: "Solo", distanceKm: 260 },
            { origin: "Solo", destination: "Yogyakarta", distanceKm: 65 },
            { origin: "Semarang", destination: "Surabaya", distanceKm: 350 },
            { origin: "Jakarta", destination: "Cirebon", distanceKm: 210 },
            { origin: "Bandung", destination: "Cirebon", distanceKm: 130 },
            { origin: "Surabaya", destination: "Cirebon", distanceKm: 570 },
            { origin: "Yogyakarta", destination: "Surabaya", distanceKm: 330 },
            { origin: "Yogyakarta", destination: "Malang", distanceKm: 400 },
            { origin: "Malang", destination: "Solo", distanceKm: 320 },
            { origin: "Jakarta", destination: "Purwokerto", distanceKm: 350 },
        ];
        const routes = await Promise.all(routesData.map((r) => prisma.route.create({ data: r })));
        console.log("✓ 20 Routes inserted");
        // ---------------------------
        // TRIPS & SEATS (20 Trips)
        // ---------------------------
        const now = new Date();
        const trips = [];
        // Generate 20 trips distributed over routes and days
        for (let i = 0; i < 20; i++) {
            const route = routes[i % routes.length];
            const bus = buses[i % buses.length];
            const dayOffset = Math.floor(i / 10); // First 10 today, next 10 tomorrow
            const day = new Date(now);
            day.setDate(now.getDate() + dayOffset);
            const departureTime = new Date(day);
            departureTime.setHours(7 + (i % 10) * 1.5, 0, 0, 0); // Spaced out times
            const arrivalTime = new Date(departureTime);
            arrivalTime.setHours(departureTime.getHours() + Math.ceil(route.distanceKm / 60));
            const trip = await prisma.trip.create({
                data: {
                    busId: bus.id,
                    routeId: route.id,
                    departureTime,
                    arrivalTime,
                    price: 50000 + route.distanceKm * 200,
                },
            });
            trips.push(trip);
            // Generate Seats for each trip
            const rows = Math.ceil(bus.totalSeat / 4);
            const seats = [];
            for (let r = 0; r < rows; r++) {
                for (let c = 1; c <= 4; c++) {
                    const seatNum = r * 4 + c;
                    if (seatNum <= bus.totalSeat) {
                        seats.push({
                            tripId: trip.id,
                            seatCode: `${String.fromCharCode(65 + r)}${c}`,
                        });
                    }
                }
            }
            await prisma.seat.createMany({ data: seats });
        }
        console.log(`✓ 20 Trips and their Seats generated`);
        // ---------------------------
        // SAMPLE BOOKINGS
        // ---------------------------
        console.log("🌱 Creating sample bookings...");
        // Booking for Andi (Confirmed)
        const tripAndi = trips[0];
        const seatsAndi = await prisma.seat.findMany({
            where: { tripId: tripAndi.id },
            take: 2,
        });
        const bookingAndi = await prisma.booking.create({
            data: {
                userId: users[0].id,
                tripId: tripAndi.id,
                status: "CONFIRMED",
                totalPrice: tripAndi.price * 2,
                expiresAt: new Date(now.getTime() + 15 * 60000),
                seats: {
                    create: seatsAndi.map((s) => ({ seatId: s.id })),
                },
            },
        });
        await prisma.payment.create({
            data: {
                bookingId: bookingAndi.id,
                orderId: `BOOK-${bookingAndi.id.slice(0, 8)}-${Date.now()}`,
                amount: bookingAndi.totalPrice,
                status: "PAID",
                transactionId: `TRX-${crypto.randomBytes(4).toString("hex")}`,
            },
        });
        // Mark seats as booked
        await prisma.seat.updateMany({
            where: { id: { in: seatsAndi.map((s) => s.id) } },
            data: { isBooked: true },
        });
        // Booking for Budi (Pending)
        const tripBudi = trips[1];
        const seatBudi = await prisma.seat.findFirst({
            where: { tripId: tripBudi.id },
        });
        if (seatBudi) {
            await prisma.booking.create({
                data: {
                    userId: users[1].id,
                    tripId: tripBudi.id,
                    status: "PENDING",
                    totalPrice: tripBudi.price,
                    expiresAt: new Date(now.getTime() + 15 * 60000),
                    seats: {
                        create: [{ seatId: seatBudi.id }],
                    },
                },
            });
        }
        console.log("✓ Sample bookings and payments inserted");
        // ---------------------------
        // TERMINALS
        // ---------------------------
        const terminalsData = [
            {
                code: "JKT-PG",
                name: "Terminal Pulo Gebang",
                city: "Jakarta",
                type: "TERMINAL",
            },
            {
                code: "JKT-KR",
                name: "Terminal Kampung Rambutan",
                city: "Jakarta",
                type: "TERMINAL",
            },
            {
                code: "BDG-LW",
                name: "Terminal Leuwipanjang",
                city: "Bandung",
                type: "TERMINAL",
            },
            {
                code: "BDG-CC",
                name: "Terminal Cicaheum",
                city: "Bandung",
                type: "TERMINAL",
            },
            {
                code: "SBY-BG",
                name: "Terminal Purabaya (Bungurasih)",
                city: "Surabaya",
                type: "TERMINAL",
            },
            {
                code: "YOG-GW",
                name: "Terminal Giwangan",
                city: "Yogyakarta",
                type: "TERMINAL",
            },
            {
                code: "SOL-TR",
                name: "Terminal Tirtonadi",
                city: "Solo",
                type: "TERMINAL",
            },
            {
                code: "SMG-MK",
                name: "Terminal Mangkang",
                city: "Semarang",
                type: "TERMINAL",
            },
            {
                code: "MLG-AR",
                name: "Terminal Arjosari",
                city: "Malang",
                type: "TERMINAL",
            },
            {
                code: "CRB-HM",
                name: "Terminal Harjamukti",
                city: "Cirebon",
                type: "TERMINAL",
            },
            {
                code: "JKT-POOL-1",
                name: "Pool Djawa Bus Jakarta",
                city: "Jakarta",
                type: "POOL",
            },
            {
                code: "BDG-POOL-1",
                name: "Pool Djawa Bus Bandung",
                city: "Bandung",
                type: "POOL",
            },
        ];
        await prisma.terminal.createMany({ data: terminalsData });
        console.log(`✓ ${terminalsData.length} Terminals inserted`);
        console.log("🌱 Seeder completed!");
        return c.json({ success: true, message: "Database seeded successfully" });
    }
    catch (e) {
        console.error(e);
        return c.json({ error: e.message }, 500);
    }
}
