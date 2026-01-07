import axios from "axios";
import { Buffer } from "node:buffer";
export async function createTransaction(serverKey, isProduction, orderId, amount, customer) {
    const BASE = isProduction
        ? "https://app.midtrans.com/snap/v1/transactions"
        : "https://app.sandbox.midtrans.com/snap/v1/transactions";
    const payload = {
        transaction_details: { order_id: orderId, gross_amount: amount },
        customer_details: customer,
        credit_card: { secure: true },
    };
    const auth = Buffer.from(serverKey + ":").toString("base64");
    // Snap API is POST /transactions (which is the BASE url itself in this var)
    // Wait, the BASE logic above is slightly wrong if I append /charge.
    // Let's correct it.
    const res = await axios.post(BASE, payload, {
        headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/json",
            Accept: "application/json",
        },
    });
    return res.data;
}
