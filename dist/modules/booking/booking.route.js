import { Hono } from "hono";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { createBookingHandler } from "./booking.controller";
const router = new Hono();
router.use("*", authMiddleware);
router.post("/", createBookingHandler);
export default router;
