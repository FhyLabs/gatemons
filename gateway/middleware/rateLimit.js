const requests = new Map();

const LIMIT = parseInt(process.env.RATE_LIMIT_MAX) || 100;
const WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 1000 * 60;
const BURST = parseInt(process.env.RATE_LIMIT_BURST) || 20; 

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
