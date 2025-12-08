import { Hono } from "hono";
import { registerHandler, loginHandler } from "./auth.controller";

const router = new Hono();
router.post("/register", registerHandler);
router.post("/login", loginHandler);

export default router;
