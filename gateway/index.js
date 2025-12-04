import dotenv from "dotenv";
dotenv.config();
import express from "express";
import apiRoute from "./routes/api.js";
import webRoute from "./routes/web.js";
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

app.use("/data", apiRoute);
app.use("/", webRoute);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[GATEWAY] running on http://localhost:${PORT}`));
