## API Reference

### POST `/`

| Method | Endpoint | Description                            | Required Headers                                    |
| ------ | -------- | -------------------------------------- | --------------------------------------------------- |
| POST   | `/`      | Send device system data to the gateway | `tenant-id`, `apikey`, `gateway-key`, `x-signature` |

#### Body (JSON)

The body is automatically sent from the `getSystemInfo()` function and may include, for example:

```json
{
  "hostname": "device-123",
  "platform": "linux",
  "cpu": "Intel(R) Core(TM) i7",
  "memory": "16GB",
  "uptime": 3600
}
```

#### Example (Node.js)

```javascript
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
        "x-signature": signature,
      },
    });

    console.log("POST RESULT:", res.data);
  } catch (err) {
    console.error("POST ERROR:", err.response?.data || err.message);
  }
}

setInterval(sendDeviceData, 5000);
sendDeviceData();
```

---

### Response

| Status Code | Description                | Example Body                                                 |
| ----------- | -------------------------- | ------------------------------------------------------------ |
| 200         | Data successfully received | `{ "status": "success", "message": "Device data received" }` |
| 4xx/5xx     | Error                      | `{ "status": "error", "message": "Invalid API key" }`        |

#### Example Response Handling (Node.js)

```javascript
try {
  await sendDeviceData();
} catch (err) {
  console.error("Error sending device data:", err.response?.data || err.message);
}
```