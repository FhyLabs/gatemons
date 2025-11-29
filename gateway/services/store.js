import crypto from "crypto";

const shards = new Map();
const queues = new Map();
const auditLogs = new Map();

// Menyimpan konfigurasi per tenant:device
const deviceConfig = new Map(); // key = tenantKey:deviceId, value = { ttl, maxRetries, maxBuffer, cleanupInterval }

// Helper untuk ambil konfigurasi per device
function getConfig(tenantKey, deviceId) {
  const key = `${tenantKey}:${deviceId}`;
  if (deviceConfig.has(key)) return deviceConfig.get(key);
  return {
    ttl: parseInt(process.env.TTL_MS) || 1000 * 60 * 60 * 24,
    maxRetries: parseInt(process.env.MAX_RETRIES) || 3,
    maxBuffer: parseInt(process.env.MAX_BUFFER) || 1000,
    cleanupInterval: parseInt(process.env.CLEANUP_INTERVAL_MS) || 1000 * 60 * 10,
  };
}

// Cleanup interval global, hapus data TTL habis per device
setInterval(() => {
  const now = Date.now();
  for (const [tenantKey, deviceMap] of shards.entries()) {
    for (const [deviceId, entry] of deviceMap.entries()) {
      const { ttl } = getConfig(tenantKey, deviceId);
      if (now - entry.timestamp > ttl) deviceMap.delete(deviceId);
    }
    if (deviceMap.size === 0) shards.delete(tenantKey);
  }
}, 1000 * 60); // interval global, TTL individual tetap berlaku

// Signature verification
export function verifySignature(tenantKey, payload, signature) {
  const secret = process.env.GATEWAY_KEY;
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(JSON.stringify(payload));
  const digest = hmac.digest("hex");
  return digest === signature;
}

// Audit logging
function logAudit(tenantKey, action) {
  if (!auditLogs.has(tenantKey)) auditLogs.set(tenantKey, []);
  auditLogs.get(tenantKey).push({ action, timestamp: Date.now() });
}

// Push data ke buffer, optional TTL/maxBuffer/maxRetries per push
export async function push(tenantKey, data, attempt = 1) {
  const deviceId = data.device || "unknown";

  // Update config per push jika ada
  if (data.ttl || data.maxBuffer || data.maxRetries) {
    const key = `${tenantKey}:${deviceId}`;
    const current = getConfig(tenantKey, deviceId);
    deviceConfig.set(key, {
      ttl: data.ttl || current.ttl,
      maxRetries: data.maxRetries || current.maxRetries,
      maxBuffer: data.maxBuffer || current.maxBuffer,
      cleanupInterval: current.cleanupInterval,
    });
  }

  if (!queues.has(tenantKey)) queues.set(tenantKey, []);
  queues.get(tenantKey).push(data);

  if (!shards.has(tenantKey)) shards.set(tenantKey, new Map());
  const tenantBuffer = shards.get(tenantKey);

  logAudit(tenantKey, "push_enqueued");

  while (queues.get(tenantKey).length > 0) {
    const item = queues.get(tenantKey).shift();
    const devId = item.device || "unknown";
    const { maxBuffer, maxRetries } = getConfig(tenantKey, devId);

    if (tenantBuffer.size >= maxBuffer) {
      if (attempt <= maxRetries) {
        queues.get(tenantKey).unshift(item);
        await new Promise(resolve => setTimeout(resolve, 50));
        return push(tenantKey, item, attempt + 1);
      } else {
        console.warn(`Tenant ${tenantKey} buffer full, data dropped`);
        logAudit(tenantKey, "push_dropped");
        continue;
      }
    }

    tenantBuffer.set(devId, { payload: item, timestamp: Date.now() });
    logAudit(tenantKey, "push_done");
    await new Promise(resolve => setImmediate(resolve));
  }
}

// Peek buffer, hanya data yang TTL belum habis
export async function peek(tenantKey) {
  if (!shards.has(tenantKey)) return [];
  const now = Date.now();
  const tenantBuffer = shards.get(tenantKey);
  const valid = [];

  for (const [deviceId, entry] of tenantBuffer.entries()) {
    const { ttl } = getConfig(tenantKey, deviceId);
    if (now - entry.timestamp <= ttl) valid.push(entry);
  }
  return valid;
}

// Hitung size buffer yang TTL belum habis
export function size(tenantKey) {
  if (!shards.has(tenantKey)) return 0;
  const now = Date.now();
  let count = 0;
  for (const [deviceId, entry] of shards.get(tenantKey).entries()) {
    if (now - entry.timestamp <= getConfig(tenantKey, deviceId).ttl) count++;
  }
  return count;
}

// Metrics buffer per tenant/device
export function metrics(tenantKey) {
  if (!shards.has(tenantKey)) return { tenant: 0, device: 0 };
  const now = Date.now();
  let deviceCount = 0;
  for (const [deviceId, entry] of shards.get(tenantKey).entries()) {
    if (now - entry.timestamp <= getConfig(tenantKey, deviceId).ttl) deviceCount++;
  }
  return { tenant: 1, device: deviceCount };
}

// Audit logs
export function getAudit(tenantKey) {
  return auditLogs.has(tenantKey) ? auditLogs.get(tenantKey) : [];
}

// Optional: set config manual per device
export function setConfig(tenantKey, deviceId, config) {
  const current = getConfig(tenantKey, deviceId);
  deviceConfig.set(`${tenantKey}:${deviceId}`, {
    ttl: config.ttl || current.ttl,
    maxRetries: config.maxRetries || current.maxRetries,
    maxBuffer: config.maxBuffer || current.maxBuffer,
    cleanupInterval: config.cleanupInterval || current.cleanupInterval,
  });
}
