const requests = new Map();

const DEFAULT_LIMIT = parseInt(process.env.RATE_LIMIT_MAX) || 100;
const DEFAULT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 1000 * 60;
const DEFAULT_BURST = parseInt(process.env.RATE_LIMIT_BURST) || 20;

export default function rateLimit(req, res, next) {
  const deviceId = req.headers["device"] || "unknown";
  const key = `${req.tenantKey}:${deviceId}`;
  const now = Date.now();

  if (!requests.has(key)) requests.set(key, []);
  const timestamps = requests.get(key).filter(t => now - t < DEFAULT_WINDOW);

  if (timestamps.length >= DEFAULT_LIMIT + DEFAULT_BURST) {
    return res.status(429).json({ error: "Rate limit exceeded" });
  }

  timestamps.push(now);
  requests.set(key, timestamps);

  next();
}
