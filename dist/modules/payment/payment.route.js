import { Hono } from "hono";
import { createPaymentHandler, midtransWebhookHandler, } from "./payment.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
const router = new Hono();
router.post("/create", authMiddleware, createPaymentHandler);
router.post("/midtrans/webhook", midtransWebhookHandler);
export default router;
