import express from "express";
import { Landing } from "../controllers/landingController.js";
import { Documentation } from "../controllers/docsController.js";

const router = express.Router();

router.get("/", Landing);
router.get("/docs", Documentation);

export default router;
