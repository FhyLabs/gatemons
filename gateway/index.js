import dotenv from "dotenv";
dotenv.config();
import express from "express";
import dataRoute from "./routes/api.js";
import { landingRoute } from "./controllers/landingController.js";
import { ok } from "./utils/response.js";

const app = express();
app.use(express.json({ limit: "10mb" }));

app.use(express.static("public"));
app.set("view engine", "ejs");
app.set("views", "./views");

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use("/data", dataRoute);
app.get("/", landingRoute);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[GATEWAY] running on http://localhost:${PORT}`));
