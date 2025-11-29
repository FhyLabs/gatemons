## API Reference

This system consists of three main components: **Client (Device)**, **Gateway**, and **Server**.

---

## 1. Client → Gateway

### POST `/data` – Send Device Data

| Method | Endpoint | Description               | Headers Required                                    |
| ------ | -------- | ------------------------- | --------------------------------------------------- |
| POST   | `/data`  | Submit device system data | `tenant-id`, `apikey`, `gateway-key`, `x-signature` |

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

* Data is queued and stored per tenant in memory.
* Retry logic handles full buffers (configurable via `MAX_RETRIES` and `MAX_BUFFER`).
* Audit logs track all actions: `push_enqueued`, `push_done`, `push_dropped`.

---

### GET `/` – Gateway Health Check

| Method | Endpoint | Description                     | Headers Required |
| ------ | -------- | ------------------------------- | ---------------- |
| GET    | `/`      | Check gateway status and uptime | None             |

**Response Example:**

```json
{
  "status": "ok",
  "uptime": 123.45
}
```

---

### GET `/data` – Peek Device Data

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

---

### GET `/data/size` – Buffer Size

| Method | Endpoint     | Description                            | Headers Required                     |
| ------ | ------------ | -------------------------------------- | ------------------------------------ |
| GET    | `/data/size` | Get number of devices stored in memory | `tenant-id`, `apikey`, `gateway-key` |

**Response Example:**

```json
{
  "size": 5
}
```

---

### GET `/data/metrics` – Metrics

| Method | Endpoint        | Description                     | Headers Required                     |
| ------ | --------------- | ------------------------------- | ------------------------------------ |
| GET    | `/data/metrics` | Get tenant/device count metrics | `tenant-id`, `apikey`, `gateway-key` |

**Response Example:**

```json
{
  "tenant": 1,
  "device": 5
}
```

---

### GET `/data/audit` – Audit Logs

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

---

## 2. Gateway → Server

### GET `/` – Fetch Latest Device Data

| Method | Endpoint | Description                         | Headers Required |
| ------ | -------- | ----------------------------------- | ---------------- |
| GET    | `/`      | Get latest device data from gateway | None             |

**Response Example:**

```json
{
  "success": true,
  "data": [
    {
      "hostname": "device-123",
      "platform": "linux",
      "cpu": "Intel(R) Core(TM) i7",
      "memory": "16GB",
      "uptime": 3600
    }
  ]
}
```

* If no data is available yet:

```json
{
  "success": true,
  "data": null
}
```

---

## Notes on Headers and Security

* **tenant-id** and **apikey** identify the client.
* **gateway-key** is required for gateway authentication.
* **x-signature** contains HMAC-SHA256 of the request payload, signed using `GATEWAY_KEY`.
* Rate limiting is applied per tenant.
* Data expires automatically based on `TTL_MS`.