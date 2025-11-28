# 🚀 Gatemons

This architecture allows multiple tenants (customers) to securely send data from various devices to a single **gateway**, while the **server** retrieves data per tenant without risk of data mixing.

```
CLIENT POST → GATEWAY ← GET SERVER
```

**Note:** The gateway **does not store data permanently** — it only maintains a temporary buffer per tenant, always overwriting old data (last state). Ideal for real-time monitoring of CPU, RAM, and devices.

---

## 🧱 System Components

| Folder     | Function                                                  |
| ---------- | --------------------------------------------------------- |
| `client/`  | Sends device data to the gateway                          |
| `gateway/` | Validates tenants & buffers the latest data               |
| `server/`  | Retrieves data from the gateway and exposes API dashboard |

---

## 🔐 Security Mechanism

Every **POST/GET** request to the gateway must include the following headers:

| Header        | Description                      |
| ------------- | -------------------------------- |
| `tenant-id`   | Tenant ID                        |
| `apikey`      | Tenant API key                   |
| `gateway-key` | Global gateway secret key (.env) |

> If any header is invalid, the gateway **rejects the request**.

---

## 📌 Data Flow

1. ⏩ **Client** sends monitoring data (CPU, RAM, etc.) every 5 seconds
2. 🧠 **Gateway** validates headers and stores the **latest state per tenant**
3. 💾 Gateway stores data in a memory map (no database)
4. 🔁 **Server** fetches data from the gateway every 5 seconds

**Advantage:** Full real-time streaming without permanent storage.

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

The client sends data every 5 seconds.

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
  "data": {
    "payload": { "device": "Device_A", "cpu": 76.44, "ram": 62.18 },
    "timestamp": 1732807609921
  }
}
```

---

## 🧠 Advantages of Last State Update

| Feature     | Description                                |
| ----------- | ------------------------------------------ |
| Lightweight | No data queue required                     |
| Realtime    | Data is always up-to-date                  |
| Minimal RAM | Only 1 snapshot per tenant                 |
| Scalable    | Can handle thousands of tenants without DB |

Suitable for:

* CPU / RAM / Network monitoring
* IoT device status
* Telemetry devices
* Industrial machine health checks