export const getStatus = (lastTimestamp) => {
  const ttl = process.env.HEARTBEAT_TTL ? Number(process.env.HEARTBEAT_TTL) : 30000;
  const now = Date.now();
  return now - lastTimestamp <= ttl ? "online" : "offline";
};
