import axios from "axios";
import { MIDTRANS_SERVER_KEY, MIDTRANS_IS_PRODUCTION } from "../../config/env";
const BASE = MIDTRANS_IS_PRODUCTION
    ? "https://api.midtrans.com/v2"
    : "https://api.sandbox.midtrans.com/v2";
export async function createTransaction(orderId, amount, customer) {
    const payload = {
        transaction_details: { order_id: orderId, gross_amount: amount },
        customer_details: customer,
    };
    const auth = Buffer.from(MIDTRANS_SERVER_KEY + ":").toString("base64");
    const res = await axios.post(`${BASE}/charge`, payload, {
        headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/json",
        },
    });
    return res.data;
}
