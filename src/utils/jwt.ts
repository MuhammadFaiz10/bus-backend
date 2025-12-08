import { SignJWT, jwtVerify } from "jose";
import { JWT_PRIVATE_KEY } from "../config/env";

const encoder = new TextEncoder();

export async function signJwt(payload: Record<string, any>, expiresIn = "7d") {
  return await new SignJWT(payload as any)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expiresIn)
    .sign(encoder.encode(JWT_PRIVATE_KEY));
}

export async function verifyJwt(token: string) {
  const alg = "HS256";
  const { payload } = await jwtVerify(token, encoder.encode(JWT_PRIVATE_KEY));
  return payload;
}
