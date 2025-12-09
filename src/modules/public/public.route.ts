import { Hono } from "hono";
import {
  listRoutesHandler,
  listTripsHandler,
  tripDetailHandler,
  listBusesHandler,
} from "./public.controller";

const router = new Hono();

router.get("/routes", listRoutesHandler); // GET /public/routes
router.get("/buses", listBusesHandler); // GET /public/buses
router.get("/trips", listTripsHandler); // GET /public/trips?from=&to=&date=
router.get("/trips/:id", tripDetailHandler); // GET /public/trips/:id

export default router;
