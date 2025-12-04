import dotenv from "dotenv";
dotenv.config();
import express from "express";
import axios from "axios";

const app = express();
app.use(express.json());

let lastData = null;

async function fetchFromGateway() {
  try {
    const res = await axios.get(process.env.GATEWAY_URL, {
      headers: {
        "tenant-id": process.env.TENANT_ID,
        "apikey": process.env.API_KEY,
        "gateway-key": process.env.GATEWAY_KEY
      }
    });

    lastData = res.data.data;
    console.log("DATA UPDATED:", lastData);
  } catch (err) {
    console.error("GET ERROR:", err.response?.data);
  }
}

setInterval(fetchFromGateway, 5000);
fetchFromGateway();

app.get("/", (req, res) => {
  res.json({
    success: true,
    data: lastData
  });
});

app.listen(process.env.PORT, () =>
  console.log(`[SERVER] listening on port ${process.env.PORT}`)
);
