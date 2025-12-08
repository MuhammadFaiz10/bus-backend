import dotenv from "dotenv";
dotenv.config();

export const PORT = process.env.PORT || "3000";
export const DATABASE_URL = process.env.DATABASE_URL || "";
export const JWT_PRIVATE_KEY = process.env.JWT_PRIVATE_KEY || "change_me";
export const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || "";
export const MIDTRANS_CLIENT_KEY = process.env.MIDTRANS_CLIENT_KEY || "";
export const MIDTRANS_IS_PRODUCTION =
  (process.env.MIDTRANS_IS_PRODUCTION || "false") === "true";
