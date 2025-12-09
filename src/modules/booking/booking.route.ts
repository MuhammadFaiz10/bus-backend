import { Hono } from "hono";
import { authMiddleware } from "../../middlewares/auth.middleware";
import {
  createBookingHandler,
  getMyBookingsHandler,
  getBookingDetailHandler,
  cancelBookingHandler,
  upcomingBookingsHandler,
} from "./booking.controller";
import { requireOwner } from "../../middlewares/rbac.middleware";

const router = new Hono();
router.use("*", authMiddleware);

// create booking
router.post("/", createBookingHandler);

// user bookings
router.get("/me", getMyBookingsHandler);
router.get("/me/upcoming", upcomingBookingsHandler);

// booking detail (owner or admin)
router.get("/:id", requireOwner("booking", "id"), getBookingDetailHandler);

// cancel booking (owner or admin)
router.post("/:id/cancel", requireOwner("booking", "id"), cancelBookingHandler);

export default router;
