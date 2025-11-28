import dotenv from "dotenv";
dotenv.config();
import express from "express";
import dataRoute from "./routes/api.js";

const app = express();
app.use(express.json({ limit: "10mb" }));

app.use("/data", dataRoute);

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime()
  });
});


app.listen(process.env.PORT, () =>
  console.log(`[GATEWAY] running on http://localhost:${process.env.PORT}`)
);
