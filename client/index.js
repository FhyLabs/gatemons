import dotenv from "dotenv";
dotenv.config();
import axios from "axios";
import crypto from "crypto";
import os from "os";

/* ---------------------------- SYSTEM SNAPSHOT ---------------------------- */
function getSystemInfo() {
  return {
    device: os.hostname(),
    platform: os.platform(),
    arch: os.arch(),
    cpu: os.cpus()[0].model,
    cpuUsage: os.loadavg()[0] || 0,
    totalMemory: os.totalmem(),
    freeMemory: os.freemem(),
    uptime: os.uptime(),
    timestamp: Date.now()
  };
}

/* ------------------------------- SIGNATURE ------------------------------- */
function generateSignature(payload) {
  const secret = process.env.GATEWAY_KEY;
  return crypto
    .createHmac("sha256", secret)
    .update(JSON.stringify(payload))
    .digest("hex");
}

/* ----------------------------- SEND SNAPSHOT ----------------------------- */
async function sendDeviceData() {
  try {
    const payload = getSystemInfo();
    const signature = generateSignature(payload);

    const res = await axios.post(process.env.GATEWAY_URL, payload, {
      headers: {
        "tenant-id": process.env.TENANT_ID,
        "apikey": process.env.API_KEY,
        "gateway-key": process.env.GATEWAY_KEY,
        "x-signature": signature,
      },
      timeout: 5000
    });

    console.log(`[OK] Snapshot sent → ${payload.device} | CPU: ${payload.cpuUsage}`);
  } catch (err) {
    console.error("[ERR]", err.response?.data || err.message);
  }
}

/* ---------------------------- HEARTBEAT INTERVAL ---------------------------- */
setInterval(sendDeviceData, 5000);
sendDeviceData();
