const buffer = new Map();

export function push(tenantKey, data) {
  if (!buffer.has(tenantKey)) buffer.set(tenantKey, []);
  buffer.get(tenantKey).push({
    payload: data,
    timestamp: Date.now()
  });
}

export function pull(tenantKey) {
  if (!buffer.has(tenantKey)) return [];
  const result = buffer.get(tenantKey);
  buffer.set(tenantKey, []);
  return result;
}

export function size(tenantKey) {
  return buffer.has(tenantKey) ? buffer.get(tenantKey).length : 0;
}
