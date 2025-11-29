import dotenv from "dotenv";
dotenv.config();
import axios from "axios";
import crypto from "crypto";

function generateSignature(payload) {
  const secret = process.env.GATEWAY_KEY;
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(JSON.stringify(payload));
  return hmac.digest("hex");
}

async function sendDeviceData() {
  try {
    const payload = {
      device: "Device_A",
      cpu: Math.random() * 100,
      ram: Math.random() * 100,
    };

    const signature = generateSignature(payload);

    const res = await axios.post(process.env.GATEWAY_URL, payload, {
      headers: {
        "tenant-id": process.env.TENANT_ID,
        "apikey": process.env.API_KEY,
        "gateway-key": process.env.GATEWAY_KEY,
        "x-signature": signature, // ✨ signature baru
      },
    });

    console.log("POST RESULT:", res.data);
  } catch (err) {
    console.error("POST ERROR:", err.response?.data || err.message);
  }
}

setInterval(sendDeviceData, 5000);
sendDeviceData();
