import { Router, Request, Response } from "express";
import { z } from "zod";
import { cacheGet, cacheSet } from "../lib/cache";
import { fetchNextService } from "../lib/nextService";

const router = Router();

const QuerySchema = z.object({
  stop_id: z.string().min(1),
  limit:   z.coerce.number().int().min(1).max(20).default(5),
});

// GET /v1/departures?stop_id=MK&limit=5
router.get("/", async (req: Request, res: Response) => {
  const parsed = QuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({
      error: "bad_request",
      message: parsed.error.issues.map((i) => i.message).join(", "),
      status: 400,
    });
  }

  const { stop_id, limit } = parsed.data;
  const CACHE_KEY = `departures:${stop_id}`;
  const cached = cacheGet<object>(CACHE_KEY);
  if (cached) return res.json(cached);

  try {
    const { generated_at, departures } = await fetchNextService(stop_id);

    const result = {
      stop_id,
      stop_name: stop_id,
      generated_at,
      departures: departures.slice(0, limit),
    };

    cacheSet(CACHE_KEY, result, 30_000);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[departures]", message);
    res.status(502).json({ error: "upstream_error", message, status: 502 });
  }
});

export default router;
