import { z } from "zod";

export const createBookingSchema = z.object({
  tripId: z.string().uuid(),
  seatCodes: z.array(z.string()).min(1),
});
