import { Hono } from "hono";
import { registerHandler, loginHandler, getMeHandler, updateMeHandler, changePasswordHandler, } from "./auth.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
const router = new Hono();
// Public routes
router.post("/register", registerHandler);
router.post("/login", loginHandler);
// Protected routes (require authentication)
router.get("/me", authMiddleware, getMeHandler);
router.put("/me", authMiddleware, updateMeHandler);
router.put("/change-password", authMiddleware, changePasswordHandler);
export default router;
