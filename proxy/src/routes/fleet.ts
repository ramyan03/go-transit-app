import { Router, Request, Response } from "express";
import { cacheGet, cacheSet } from "../lib/cache";
import { metrolinxGet } from "../lib/metrolinx";

const router = Router();

// GET /v1/fleet/consist — live train consist data (which cars are on which train)
router.get("/consist", async (_req: Request, res: Response) => {
  const CACHE_KEY = "fleet:consist";
  const cached = cacheGet<object>(CACHE_KEY);
  if (cached) return res.json(cached);

  try {
    const data = await metrolinxGet("api/V1/Fleet/Consist/All.json");
    cacheSet(CACHE_KEY, data, 60_000); // 60s cache
    res.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[fleet/consist]", message);
    res.status(502).json({ error: "upstream_error", message, status: 502 });
  }
});

export default router;
