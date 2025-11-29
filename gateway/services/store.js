import crypto from "crypto";

const shards = new Map();
const queues = new Map();
const auditLogs = new Map();

const TTL = 1000 * 60 * 60 * 24;
const MAX_RETRIES = 3;
const MAX_BUFFER = 1000;

setInterval(() => {
  const now = Date.now();
  for (const [tenantKey, deviceMap] of shards.entries()) {
    for (const [deviceId, entry] of deviceMap.entries()) {
      if (now - entry.timestamp > TTL) deviceMap.delete(deviceId);
    }
    if (deviceMap.size === 0) shards.delete(tenantKey);
  }
}, 1000 * 60 * 10);

export function verifySignature(tenantKey, payload, signature) {
  const secret = process.env.GATEWAY_KEY;
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(JSON.stringify(payload));
  const digest = hmac.digest("hex");
  return digest === signature;
}

function logAudit(tenantKey, action) {
  if (!auditLogs.has(tenantKey)) auditLogs.set(tenantKey, []);
  auditLogs.get(tenantKey).push({ action, timestamp: Date.now() });
}

export async function push(tenantKey, data, attempt = 1) {
  if (!queues.has(tenantKey)) queues.set(tenantKey, []);
  queues.get(tenantKey).push(data);

  if (!shards.has(tenantKey)) shards.set(tenantKey, new Map());
  const tenantBuffer = shards.get(tenantKey);

  logAudit(tenantKey, "push_enqueued");

  while (queues.get(tenantKey).length > 0) {
    const item = queues.get(tenantKey).shift();
    const deviceId = item.device || "unknown";

    if (tenantBuffer.size >= MAX_BUFFER) {
      if (attempt <= MAX_RETRIES) {
        queues.get(tenantKey).unshift(item);
        await new Promise(resolve => setTimeout(resolve, 50));
        return push(tenantKey, item, attempt + 1);
      } else {
        console.warn(`Tenant ${tenantKey} buffer full, data dropped`);
        logAudit(tenantKey, "push_dropped");
        continue;
      }
    }

    tenantBuffer.set(deviceId, { payload: item, timestamp: Date.now() });
    logAudit(tenantKey, "push_done");
    await new Promise(resolve => setImmediate(resolve));
  }
}

export async function peek(tenantKey) {
  if (!shards.has(tenantKey)) return [];
  const tenantBuffer = shards.get(tenantKey);
  return Array.from(tenantBuffer.values());
}

export function size(tenantKey) {
  return shards.has(tenantKey) ? shards.get(tenantKey).size : 0;
}

export function metrics(tenantKey) {
  const tenantCount = shards.has(tenantKey) ? 1 : 0;
  const deviceCount = shards.has(tenantKey) ? shards.get(tenantKey).size : 0;
  return { tenant: tenantCount, device: deviceCount };
}

export function getAudit(tenantKey) {
  return auditLogs.has(tenantKey) ? auditLogs.get(tenantKey) : [];
}
