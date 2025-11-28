import express from "express";
import auth from "../middleware/auth.js";
import { push, pull, size } from "../services/store.js";

const router = express.Router();

router.post("/", auth, (req, res) => {
  push(req.tenantKey, req.body);
  res.json({ status: "saved" });
});

router.get("/", auth, (req, res) => {
  const data = pull(req.tenantKey);
  res.json({ data });
});

export default router;
