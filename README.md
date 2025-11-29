# Gatemons [ID](./README-ID.md)

<center><img src="./ss.png" /></center>

This architecture allows **multiple tenants (customers)** to securely send data from various devices to a single gateway, while the server can fetch data per tenant without risking data mixing.

```
CLIENT POST → GATEWAY ← GET SERVER
```

**Note:** The gateway **does not store data permanently** — it only keeps a **temporary buffer in memory per tenant per device**, always overwriting old data. Ideal for real-time monitoring of CPU, RAM, and device status.

> Since the **gateway is the hub** of this architecture, **clients and servers can use any technology or programming language**. The only requirement is to follow the gateway’s HTTP API protocol and include headers and payloads correctly (`tenant-id`, `apikey`, `gateway-key`, `x-signature`).

---

## 🧱 System Components

| Folder     | Function                                                            |
| ---------- | ------------------------------------------------------------------- |
| `client/`  | Sends device data to the gateway                                    |
| `gateway/` | Validates tenants, verifies HMAC signatures, stores the latest data |
| `server/`  | Retrieves data from the gateway and provides API/dashboard          |

---

## 🔐 Security Mechanism

Every **POST/GET** request to the gateway must include the following headers:

| Header        | Description                                              |
| ------------- | -------------------------------------------------------- |
| `tenant-id`   | Tenant ID                                                |
| `apikey`      | Tenant API key                                           |
| `gateway-key` | Global gateway secret (.env)                             |
| `x-signature` | HMAC SHA256 signature of the payload (required for POST) |

> If any header or signature is invalid, the gateway **rejects the request**.

---

## 📝 Features

* HMAC signature verification for each POST request
* Middleware authentication (`tenant-id`, `apikey`, `gateway-key`)
* Rate limiting per tenant
* Async queue for push operations per tenant
* Retry mechanism when buffer is full
* Configurable buffer limit per tenant (`MAX_BUFFER`)
* Automatic data cleanup (default TTL: 24 hours)
* Audit log for push, pull, enqueue, drop events per tenant
* Buffer per device → **no duplicate devices**
* Always returns **latest status** without deleting the buffer
* Shows device count per tenant
* Metrics collection
* Audit log per tenant
* Automatic cleanup every 10 minutes
* Non-blocking event loop
* Safe handling for tenants without data

---

## 📌 Data Flow

1. ⏩ **Client** sends monitoring data (CPU, RAM, etc.) every 5 seconds
2. 🧠 **Gateway** validates headers and signature, then updates **latest status per device**
3. 💾 Gateway stores data in **memory** (no database)
4. 🔁 **Server** periodically fetches data from the gateway

**Advantage:** Full real-time streaming without permanent storage or data duplication.

---

## ⚙ Installation & Running

### 1️⃣ Gateway

```bash
cd gateway
npm install
npm run dev
```

Gateway available at:

```
http://localhost:3000
```

### 2️⃣ Client

```bash
cd client
npm install
node index.js
```

The client will create **HMAC signatures** and send data every 5 seconds.

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

## 🔍 Example Requests & Responses

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

| Feature                | Description                                     |
| ---------------------- | ----------------------------------------------- |
| HMAC Verified          | Ensures payload integrity                       |
| Lightweight            | No permanent DB, only per-device snapshots      |
| Realtime               | Data is always up-to-date                       |
| Non-Duplicated Devices | Each device has only one latest payload         |
| Async & Retry          | Non-blocking, automatic retry if buffer is full |
| Audit Logging          | Tracks tenant activity                          |
| Scalable               | Handles thousands of tenants in memory          |
| Minimal RAM            | Only stores the last state per device           |

Ideal for:

* CPU / RAM / Network monitoring
* IoT device status
* Telemetry devices
* Industrial machine health monitoring