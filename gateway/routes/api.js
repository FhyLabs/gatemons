import express from "express";
import auth from "../middleware/auth.js";
import rateLimit from "../middleware/rateLimit.js";
import { push, peek, size, metrics, verifySignature, getAudit } from "../services/store.js";
import { ok, error } from "../utils/response.js";

const router = express.Router();
router.use(auth, rateLimit);

router.post("/", async (req, res) => {
  const signature = req.headers["x-signature"];
  if (!signature || !verifySignature(req.tenantKey, req.body, signature)) {
    return error(res, "Invalid signature", 401);
  }

  await push(req.tenantKey, req.body);
  return ok(res, { status: "saved" });
});

router.get("/", async (req, res) => {
  const data = await peek(req.tenantKey);
  return ok(res, { data, total: data.length });
});

router.get("/size", (req, res) => {
  return ok(res, { size: size(req.tenantKey) });
});

router.get("/metrics", (req, res) => {
  return ok(res, metrics(req.tenantKey));
});

router.get("/audit", (req, res) => {
  return ok(res, { audit: getAudit(req.tenantKey) });
});

export default router;
