import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { verifyConnection } from "./db/connection.js";
import taskRoutes from "./routes/task.route.js";
import { AppError } from "./errors/AppError.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", async (req, res) => {
  const dbUp = await verifyConnection();
  res.status(dbUp ? 200 : 503).json({ status: dbUp ? "ok" : "db_unreachable" });
});

app.use("/api", taskRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});


app.use((err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: "Something went wrong." });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`TaskGraph backend running on port ${PORT}`),
);
