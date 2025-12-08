import { Hono } from "hono";
import { authMiddleware, adminOnly } from "../../middlewares/auth.middleware";
import { dailyRevenueHandler, monthlyRevenueHandler, revenueByRouteHandler, revenueByBusHandler, paginatedBookingsHandler, bookingStatsHandler, createUserHandler, listUsersHandler, promoteUserHandler, createBusHandler, updateBusHandler, deleteBusHandler, listBusesHandler, createRouteHandler, updateRouteHandler, deleteRouteHandler, listRoutesHandler, createTripHandler, updateTripHandler, deleteTripHandler, listTripsHandler, } from "./admin.controller";
const router = new Hono();
// protect all admin routes
router.use("*", authMiddleware);
router.use("*", adminOnly);
// Revenue
router.get("/revenue/daily", dailyRevenueHandler);
router.get("/revenue/monthly", monthlyRevenueHandler);
router.get("/revenue/route", revenueByRouteHandler);
router.get("/revenue/bus", revenueByBusHandler);
// Bookings & stats
router.get("/bookings", paginatedBookingsHandler);
router.get("/bookings/stats", bookingStatsHandler);
// User management
router.post("/users", createUserHandler);
router.get("/users", listUsersHandler);
router.post("/users/:id/promote", promoteUserHandler);
// Bus management
router.post("/buses", createBusHandler);
router.put("/buses/:id", updateBusHandler);
router.delete("/buses/:id", deleteBusHandler);
router.get("/buses", listBusesHandler);
// Route management
router.post("/routes", createRouteHandler);
router.put("/routes/:id", updateRouteHandler);
router.delete("/routes/:id", deleteRouteHandler);
router.get("/routes", listRoutesHandler);
// Trip management
router.post("/trips", createTripHandler);
router.put("/trips/:id", updateTripHandler);
router.delete("/trips/:id", deleteTripHandler);
router.get("/trips", listTripsHandler);
export default router;
