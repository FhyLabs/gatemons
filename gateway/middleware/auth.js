export default function auth(req, res, next) {
  const tenantId = req.headers["tenant-id"];
  const apiKey = req.headers["apikey"];
  const gatewayKey = req.headers["gateway-key"];

  if (!tenantId || !apiKey) {
    return res.status(400).json({ error: "Missing tenant-id or apikey" });
  }

  if (!gatewayKey || gatewayKey !== process.env.GATEWAY_KEY) {
    return res.status(401).json({ error: "Invalid gateway-key" });
  }

  req.tenantKey = `${tenantId}:${apiKey}`;
  next();
}
