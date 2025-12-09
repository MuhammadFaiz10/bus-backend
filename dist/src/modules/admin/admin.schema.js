import { z } from "zod";
/** USER MANAGEMENT */
export const createUserSchema = z.object({
    name: z.string().optional(),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(["ADMIN", "USER"]).optional(),
});
export const promoteUserSchema = z.object({
    role: z.enum(["ADMIN", "USER"]),
});
/** BUS MANAGEMENT */
export const createBusSchema = z.object({
    name: z.string().min(1),
    plate: z.string().min(3),
    totalSeat: z.number().int().positive(),
});
export const updateBusSchema = createBusSchema.partial();
/** ROUTE MANAGEMENT */
export const createRouteSchema = z.object({
    origin: z.string().min(1),
    destination: z.string().min(1),
    distanceKm: z.number().int().positive(),
});
export const updateRouteSchema = createRouteSchema.partial();
/** TRIP MANAGEMENT */
export const createTripSchema = z.object({
    busId: z.string().uuid(),
    routeId: z.string().uuid(),
    departureTime: z.string(),
    arrivalTime: z.string(),
    price: z.number().int().positive(),
    generateSeats: z.boolean().optional(),
    rows: z.number().int().positive().optional(),
    cols: z.number().int().positive().optional(),
});
export const updateTripSchema = createTripSchema.partial();
