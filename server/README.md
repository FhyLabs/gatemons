## API Reference

### GET `/`

| Method | Endpoint | Description                                              | Headers Required                            |
| ------ | -------- | -------------------------------------------------------- | ------------------------------------------- |
| GET    | `/`      | Retrieve the latest device data fetched from the gateway | None (optional authentication can be added) |

#### Response

The server returns the last data received from the gateway:

```json
{
  "success": true,
  "data": {
    "hostname": "device-123",
    "platform": "linux",
    "cpu": "Intel(R) Core(TM) i7",
    "memory": "16GB",
    "uptime": 3600
  }
}
```

If no data is available yet:

```json
{
  "success": true,
  "data": null
}
```

---

### Implementation (Node.js / Express)

```javascript
import dotenv from "dotenv";
dotenv.config();
import express from "express";
import axios from "axios";

const app = express();
app.use(express.json());

let lastData = null;

// Function to fetch data from the gateway
async function fetchFromGateway() {
  try {
    const res = await axios.get(process.env.GATEWAY_URL, {
      headers: {
        "tenant-id": process.env.TENANT_ID,
        "apikey": process.env.API_KEY,
        "gateway-key": process.env.GATEWAY_KEY
      }
    });

    lastData = res.data.data;
    console.log("DATA UPDATED:", lastData);
  } catch (err) {
    console.error("GET ERROR:", err.response?.data || err.message);
  }
}

// Fetch data every 5 seconds
setInterval(fetchFromGateway, 5000);
fetchFromGateway();

// Endpoint to serve the latest data
app.get("/", (req, res) => {
  res.json({
    success: true,
    data: lastData
  });
});

// Start the server
app.listen(process.env.PORT, () =>
  console.log(`[SERVER] listening on port ${process.env.PORT}`)
);
```