import axios from "axios";
import { Buffer } from "node:buffer";

export async function createTransaction(
  serverKey: string,
  isProduction: boolean,
  orderId: string,
  amount: number,
  customer: { first_name?: string; email?: string; phone?: string }
) {
  const BASE = isProduction
    ? "https://api.midtrans.com/v2"
    : "https://api.sandbox.midtrans.com/v2";

  const payload = {
    transaction_details: { order_id: orderId, gross_amount: amount },
    customer_details: customer,
  };

  const auth = Buffer.from(serverKey + ":").toString("base64");
  const res = await axios.post(`${BASE}/charge`, payload, {
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
  });

  return res.data;
}
