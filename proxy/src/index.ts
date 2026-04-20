import "dotenv/config";
import express from "express";
import cors from "cors";

import realtimeRouter   from "./routes/realtime";
import gtfsRouter       from "./routes/gtfs";
import departuresRouter from "./routes/departures";
import stopsRouter      from "./routes/stops";
import routesRouter     from "./routes/routes";
import fleetRouter      from "./routes/fleet";

const app  = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.CORS_ORIGIN ?? "*" }));
app.use(express.json());

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    metrolinx_key: !!process.env.METROLINX_API_KEY,
  });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/v1/realtime",   realtimeRouter);
app.use("/v1/gtfs",       gtfsRouter);
app.use("/v1/departures", departuresRouter);
app.use("/v1/stops",      stopsRouter);
app.use("/v1/routes",     routesRouter);
app.use("/v1/fleet",      fleetRouter);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "not_found", message: "Route not found", status: 404 });
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[unhandled]", err.message);
  res.status(500).json({ error: "internal_error", message: err.message, status: 500 });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`GO Tracker proxy running on http://localhost:${PORT}`);
  if (!process.env.METROLINX_API_KEY) {
    console.warn("⚠  METROLINX_API_KEY not set — realtime endpoints will fail with 401");
  }
});
