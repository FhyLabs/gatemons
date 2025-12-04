# GateMons

GateMons Gateway is an **HTTP real-time telemetry gateway**.
Clients send device snapshots → Gateway stores them → Server fetches the latest snapshot → **no database & no data mixing between tenants**.

# Base URL Gateway

| Environment | URL                           | Description                                |
| ----------- | ----------------------------- | ------------------------------------------ |
| Local       | `http://localhost:3000`       | For testing on a local server              |
| Demo        | `https://gatemons.vercel.app` | For quick demo/testing without local setup |

> All endpoints in this documentation are relative to the Base URL above.
> Example: POST `/data` → `http://localhost:3000/data` or `https://gatemons.vercel.app/data`.

# Common Headers

All requests to the Gateway must include the following headers:

| Header        | Required | Used by    | Description                        |
| ------------- | -------- | ---------- | ---------------------------------- |
| `tenant-id`   | ✔        | POST + GET | Tenant ID                          |
| `apikey`      | ✔        | POST + GET | Tenant API key                     |
| `gateway-key` | ✔        | POST + GET | Global gateway secret              |
| `x-signature` | ✔        | POST       | HMAC SHA256 of payload + timestamp |

> If any header does not match → **the Gateway rejects the request**.

# Client → Gateway

Clients send system or device status data to the Gateway.

### Send Device Data

| Method | Endpoint | Description        | Headers Required                                    |
| ------ | -------- | ------------------ | --------------------------------------------------- |
| POST   | `/data`  | Submit device data | `tenant-id`, `apikey`, `gateway-key`, `x-signature` |

**Body (JSON):**

```json
{
  "device": "device-123",
  "hostname": "device-123",
  "platform": "linux",
  "cpu": "Intel(R) Core(TM) i7",
  "memory": "16GB",
  "uptime": 3600
}
```

**Responses:**

* **200 Success:**

```json
{
  "status": "saved"
}
```

* **401 Invalid Signature:**

```json
{
  "error": "Invalid signature"
}
```

* **400 Missing Headers:**

```json
{
  "error": "Missing tenant-id or apikey"
}
```

* **429 Rate Limit Exceeded:**

```json
{
  "error": "Rate limit exceeded"
}
```

**Notes:**

* Each `device` is unique → one device = one buffer.
* The next request will **overwrite** previous data (no duplication).
* Signature must cover the JSON-stringified payload.
* Retry logic handles full buffer (`MAX_RETRIES` and `MAX_BUFFER`).
* Audit logs track all actions: `push_enqueued`, `push_done`, `push_dropped`.

### Gateway Health Check

| Method | Endpoint | Description                   | Headers Required |
| ------ | -------- | ----------------------------- | ---------------- |
| GET    | `/`      | Check gateway status & uptime | None             |

**Response Example:**

```json
{
  "status": "ok",
  "uptime": 123.45
}
```

### Peek Device Data

| Method | Endpoint | Description                            | Headers Required                     |
| ------ | -------- | -------------------------------------- | ------------------------------------ |
| GET    | `/data`  | Retrieve stored device data for tenant | `tenant-id`, `apikey`, `gateway-key` |

**Response Example:**

```json
{
  "data": [
    { "payload": { /* device data */ }, "timestamp": 1700000000000 }
  ],
  "total": 1
}
```

### Buffer Size

| Method | Endpoint     | Description                        | Headers Required                     |
| ------ | ------------ | ---------------------------------- | ------------------------------------ |
| GET    | `/data/size` | Number of devices stored in memory | `tenant-id`, `apikey`, `gateway-key` |

**Response Example:**

```json
{
  "size": 5
}
```

### Metrics

| Method | Endpoint        | Description                 | Headers Required                     |
| ------ | --------------- | --------------------------- | ------------------------------------ |
| GET    | `/data/metrics` | Tenant/device count metrics | `tenant-id`, `apikey`, `gateway-key` |

**Response Example:**

```json
{
  "tenant": 1,
  "device": 5
}
```

### Audit Logs

| Method | Endpoint      | Description                    | Headers Required                     |
| ------ | ------------- | ------------------------------ | ------------------------------------ |
| GET    | `/data/audit` | Retrieve audit logs for tenant | `tenant-id`, `apikey`, `gateway-key` |

**Response Example:**

```json
{
  "audit": [
    { "action": "push_enqueued", "timestamp": 1700000000000 },
    { "action": "push_done", "timestamp": 1700000000050 }
  ]
}
```

# Gateway → Server

Servers fetch the latest device data from the Gateway.

### Fetch Latest Snapshot

| Method | Endpoint | Description                | Headers Required                     |
| ------ | -------- | -------------------------- | ------------------------------------ |
| GET    | `/data`  | Get latest device snapshot | `tenant-id`, `apikey`, `gateway-key` |

**Response Example:**

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

### Heartbeat Status

| Method | Endpoint          | Description                          | Headers Required                     |
| ------ | ----------------- | ------------------------------------ | ------------------------------------ |
| GET    | `/data/heartbeat` | Online/offline status of each device | `tenant-id`, `apikey`, `gateway-key` |

**Response Example:**

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

> Status is calculated using `TTL_MS` (default 30 seconds):
>
> ```
> online  -> last update ≤ TTL
> offline -> last update > TTL
> ```

### Active Devices

| Method | Endpoint        | Description                         | Headers Required                     |
| ------ | --------------- | ----------------------------------- | ------------------------------------ |
| GET    | `/data/metrics` | Number of active devices per tenant | `tenant-id`, `apikey`, `gateway-key` |

**Response Example:**

```json
{
  "success": true,
  "tenant": 1,
  "device": 1
}
```

# Notes on Headers & Security

* `tenant-id` and `apikey` → identify the client/tenant.
* `gateway-key` → used for gateway authentication.
* `x-signature` → HMAC-SHA256 of payload, signed with `GATEWAY_KEY`.
* Rate limiting is applied per tenant.
* Data expires automatically based on `TTL_MS`.

# Example Implementation

### Client (Node.js)

```js
const axios = require("axios");
const crypto = require("crypto");

const payload = { device: "DEVICE_A", cpu: 65.32, ram: 52.11 };
const signature = crypto.createHmac("sha256", "GATEWAY_SECRET")
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

### Server (Node.js)

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

# Error Codes

| Status | Code                | Cause                    |
| ------ | ------------------- | ------------------------ |
| 401    | `INVALID_SIGNATURE` | HMAC signature incorrect |
| 401    | `UNAUTHORIZED`      | Header mismatch          |
| 400    | `INVALID_PAYLOAD`   | Invalid request body     |
| 429    | `RATE_LIMIT`        | Too many requests        |
| 500    | `SERVER_ERROR`      | Internal gateway error   |

# Summary Actions

| Action                 | Endpoint              | Used by   |
| ---------------------- | --------------------- | --------- |
| Send device data       | `POST /data`          | Client    |
| Get latest device data | `GET /data`           | Server    |
| Count active devices   | `GET /data/metrics`   | Server    |
| Heartbeat status list  | `GET /data/heartbeat` | Server    |
| Signature header       | `x-signature`         | POST only |