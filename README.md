# 🚀 Gatemons

This architecture allows multiple tenants (customers) to securely send data from various devices to a single gateway, while the server retrieves data per tenant without risk of data mixing.

```
CLIENT POST → GATEWAY ← GET SERVER
```

**Note:** The gateway **does not store data permanently** — it maintains a **temporary in-memory buffer per tenant per device**, always overwriting old data. Ideal for real-time monitoring of CPU, RAM, and devices.

---

## 🧱 System Components

| Folder     | Function                                                        |
| ---------- | --------------------------------------------------------------- |
| `client/`  | Sends device data to the gateway                                |
| `gateway/` | Validates tenants, verifies HMAC signature, buffers latest data |
| `server/`  | Retrieves data from the gateway and exposes API dashboard       |

---

## 🔐 Security Mechanism

Every **POST/GET** request to the gateway must include the following headers:

| Header        | Description                                          |
| ------------- | ---------------------------------------------------- |
| `tenant-id`   | Tenant ID                                            |
| `apikey`      | Tenant API key                                       |
| `gateway-key` | Global gateway secret key (.env)                     |
| `x-signature` | HMAC SHA256 signature of payload (required for POST) |

> If any header or signature is invalid, the gateway **rejects the request**.

---

## 📝 Features

* HMAC signature verification per POST request
* Auth middleware (`tenant-id`, `apikey`, `gateway-key`)
* Rate limiting per tenant
* Async queue for push operations per tenant
* Retry mechanism for buffer overflow
* Configurable buffer limit per tenant (`MAX_BUFFER`)
* Data TTL automatic cleanup (default 24 hours)
* Audit log for push, pull, enqueue, drop events per tenant
* Per-device buffer → **no duplicate devices**
* Always returns **latest state** without clearing buffer
* Number of devices per tenant
* Metrics
* Audit logs per tenant
* Automatic cleanup every 10 minutes
* Non-blocking event loop
* Safe handling for tenants with no data

---

## 📌 Data Flow

1. ⏩ **Client** sends monitoring data (CPU, RAM, etc.) every 5 seconds
2. 🧠 **Gateway** validates headers and signature, then updates **latest state per device**
3. 💾 Gateway stores data in **memory map** (no database)
4. 🔁 **Server** fetches data from the gateway periodically

**Advantage:** Full real-time streaming without permanent storage or data duplication.

---

## ⚙ Installation & Running

### 1️⃣ Gateway

```bash
cd gateway
npm install
npm run dev
```

The gateway is available at:

```
http://localhost:3000
```

### 2️⃣ Client

```bash
cd client
npm install
node index.js
```

Client generates **HMAC signature** and sends data every 5 seconds.

### 3️⃣ Server

```bash
cd server
npm install
npm start
```

Server route to fetch data:

```
GET http://localhost:4000/data
```

---

## 🔍 Example Request & Response

### Client POST → Gateway

```
POST /data
Headers:
  tenant-id: TENANT01
  apikey: ABC123
  gateway-key: GATEWAY-API-SECRET
  x-signature: <HMAC-SIGNATURE>

Body:
{
  "device": "Device_A",
  "cpu": 76.44,
  "ram": 62.18
}
```

### Server GET → Gateway

```
GET /data
```

Response:

```json
{
  "success": true,
  "data": [
    {
      "payload": { "device": "Device_A", "cpu": 76.44, "ram": 62.18 },
      "timestamp": 1732807609921
    }
  ]
}
```

### GET /metrics → Gateway

```
GET /data/metrics
```

Response:

```json
{
  "tenant": 1,
  "device": 1
}
```

---

## 🧠 Advantages of Last State & Advanced Features

| Feature                | Description                                  |
| ---------------------- | -------------------------------------------- |
| HMAC Verified          | Ensures payload integrity                    |
| Lightweight            | No persistent DB, per-device snapshot only   |
| Realtime               | Data always up-to-date                       |
| Non-Duplicated Devices | Each device has only 1 latest payload        |
| Async & Retry          | Non-blocking, automatic retry on buffer full |
| Audit Logging          | Track tenant activities                      |
| Scalable               | Handles thousands of tenants in-memory       |
| Minimal RAM            | Only last state per device is stored         |

Suitable for:

* CPU / RAM / Network monitoring
* IoT device status
* Telemetry devices
* Industrial machine health checks