import { Router, Request, Response } from "express";
import fetch from "node-fetch";
import { cacheGet, cacheSet } from "../lib/cache";

const router = Router();

const GTFS_ZIP_URL =
  "https://www.gotransit.com/static_files/gotransit/assets/Files/GO_GTFS.zip";

// Derive a version string from the zip's Last-Modified header.
async function fetchGtfsVersion(): Promise<{ version: string; published_date: string }> {
  const res = await fetch(GTFS_ZIP_URL, { method: "HEAD" });
  const lastModified = res.headers.get("last-modified");
  if (!lastModified) {
    const today = new Date().toISOString().slice(0, 10);
    return { version: today, published_date: today };
  }
  const date = new Date(lastModified);
  const version = date.toISOString().slice(0, 10); // YYYY-MM-DD
  return { version, published_date: date.toISOString() };
}

// GET /v1/gtfs/version
router.get("/version", async (_req: Request, res: Response) => {
  const CACHE_KEY = "gtfs:version";
  const cached = cacheGet<object>(CACHE_KEY);
  if (cached) return res.json(cached);

  try {
    const data = await fetchGtfsVersion();
    cacheSet(CACHE_KEY, data, 60 * 60_000); // cache 1 hour
    res.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[gtfs/version]", message);
    res.status(502).json({ error: "upstream_error", message, status: 502 });
  }
});

// GET /v1/gtfs/download — proxies the zip stream to the client
router.get("/download", async (_req: Request, res: Response) => {
  try {
    const upstream = await fetch(GTFS_ZIP_URL);
    if (!upstream.ok) {
      return res
        .status(502)
        .json({ error: "upstream_error", message: `GTFS zip returned ${upstream.status}`, status: 502 });
    }

    const contentLength = upstream.headers.get("content-length");
    const lastModified  = upstream.headers.get("last-modified");

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", 'attachment; filename="GO_GTFS.zip"');
    if (contentLength) res.setHeader("Content-Length", contentLength);
    if (lastModified)  res.setHeader("Last-Modified", lastModified);

    upstream.body?.pipe(res);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[gtfs/download]", message);
    res.status(502).json({ error: "upstream_error", message, status: 502 });
  }
});

export default router;
