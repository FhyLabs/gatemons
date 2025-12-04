# GateMons

GateMons Gateway is an **HTTP real-time telemetry gateway**.
Clients send device *snapshots* → Server retrieves the latest snapshot → **no database & no data mixing between tenants**.

### Headers

Every request to the gateway must include the following headers:

| Header        | Required | Used by    | Description                        |
| ------------- | -------- | ---------- | ---------------------------------- |
| `tenant-id`   | ✔        | POST + GET | Tenant ID                          |
| `apikey`      | ✔        | POST + GET | Tenant API key                     |
| `gateway-key` | ✔        | POST + GET | Global gateway secret              |
| `x-signature` | ✔        | POST       | HMAC SHA256 of payload + timestamp |

If any header does not match → **the gateway rejects the request**.

### Client → Gateway

URL

```
POST /data
```

Headers

```http
tenant-id: TENANT01
apikey: ABC123
gateway-key: GATEWAY_SECRET
x-signature: <HMAC-SIGNATURE>
```

Request Body (payload)

```json
{
  "device": "DEVICE_A",
  "cpu": 65.32,
  "ram": 52.11,
  "timestamp": 1732812300456
}
```

Important Notes

* `device` is unique → 1 device = 1 buffer
* next request will **overwrite** the previous data (no duplication)
* signature must cover the JSON-stringified payload

### Server → Gateway

URL

```
GET /data
```

Headers

```http
tenant-id: TENANT01
apikey: ABC123
gateway-key: GATEWAY_SECRET
```

Response

```json
{
  "success": true,
  "data": [
    {
      "payload": {
        "device": "DEVICE_A",
        "cpu": 65.32,
        "ram": 52.11
      },
      "timestamp": 1732812300456,
      "status": "online"
    }
  ]
}
```

The server receives the **latest snapshot for every device**, now including **heartbeat status**.

### Heartbeat Status

URL

```
GET /data/heartbeat
```

Headers

```http
tenant-id: TENANT01
apikey: ABC123
gateway-key: GATEWAY_SECRET
```

Response

```json
{
  "success": true,
  "total": 1,
  "devices": [
    {
      "device": "DEVICE_A",
      "timestamp": 1732812300456,
      "status": "online"
    }
  ]
}
```

Heartbeat is calculated using:

```
status = online   -> last update ≤ TTL
status = offline  -> last update > TTL
```

Default TTL = **30 seconds**, configurable via `.env`:

```
HEARTBEAT_TTL=30000
```

### Active Devices

URL

```
GET /data/metrics
```

Headers

```http
tenant-id: TENANT01
apikey: ABC123
gateway-key: GATEWAY_SECRET
```

Response

```json
{
  "success": true,
  "tenant": 1,
  "device": 1
}
```

### Client Example (Node.js)

```js
const axios = require("axios");
const crypto = require("crypto");

const payload = { device: "DEVICE_A", cpu: 65.32, ram: 52.11 };

const signature = crypto
  .createHmac("sha256", "GATEWAY_SECRET")
  .update(JSON.stringify(payload))
  .digest("hex");

await axios.post("http://localhost:3000/data", payload, {
  headers: {
    "tenant-id": "TENANT01",
    apikey: "ABC123",
    "gateway-key": "GATEWAY_SECRET",
    "x-signature": signature
  }
});
```

### Server Example (Node.js)

```js
const axios = require("axios");

const res = await axios.get("http://localhost:3000/data", {
  headers: {
    "tenant-id": "TENANT01",
    apikey: "ABC123",
    "gateway-key": "GATEWAY_SECRET"
  }
});

console.log(res.data.data);
```

### Error Codes

| Status | Code                | Cause                    |
| ------ | ------------------- | ------------------------ |
| 401    | `INVALID_SIGNATURE` | Incorrect HMAC signature |
| 401    | `UNAUTHORIZED`      | Header mismatch          |
| 400    | `INVALID_PAYLOAD`   | Invalid request body     |
| 429    | `RATE_LIMIT`        | Too many requests        |
| 500    | `SERVER_ERROR`      | Internal gateway error   |

### Summary

| Action                 | Endpoint              | Used by   |
| ---------------------- | --------------------- | --------- |
| Send device data       | `POST /data`          | Client    |
| Get latest device data | `GET /data`           | Server    |
| Count active devices   | `GET /data/metrics`   | Server    |
| Heartbeat status list  | `GET /data/heartbeat` | Server    |
| Signature header       | `x-signature`         | POST only |

### When is GateMons Suitable?

| Use Case                            | Suitable                 |
| ----------------------------------- | ------------------------ |
| Server monitoring (CPU/RAM/Storage) | ✔                        |
| Real-time IoT                       | ✔                        |
| Device status dashboard             | ✔                        |
| Historical database                 | ✔ (external DB required) |