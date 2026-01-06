import { Hono } from "hono";
import { seedHandler } from "./seed.controller";

const router = new Hono();

router.post("/seed", seedHandler);

export default router;
