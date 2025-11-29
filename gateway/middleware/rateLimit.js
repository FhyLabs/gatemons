const requests = new Map();
const LIMIT = 100; // max 100 request
const WINDOW = 1000 * 60; // per 1 menit
const BURST = 20; // max burst

export default function rateLimit(req, res, next) {
  const key = req.tenantKey;
  const now = Date.now();

  if (!requests.has(key)) requests.set(key, []);
  const timestamps = requests.get(key).filter(t => now - t < WINDOW);
  
  if (timestamps.length >= LIMIT + BURST) {
    return res.status(429).json({ error: "Rate limit exceeded" });
  }

  timestamps.push(now);
  requests.set(key, timestamps);

  next();
}
