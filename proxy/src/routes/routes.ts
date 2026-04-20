import { Router, Request, Response } from "express";

const router = Router();

// Hardcoded GO Transit routes — these rarely change.
// route_type: 2 = rail, 3 = bus
const GO_ROUTES = [
  // Trains
  { route_id: "LW", route_short_name: "LW", route_long_name: "Lakeshore West",  route_type: 2, route_color: "009BC9" },
  { route_id: "LE", route_short_name: "LE", route_long_name: "Lakeshore East",  route_type: 2, route_color: "EE3124" },
  { route_id: "ST", route_short_name: "ST", route_long_name: "Stouffville",     route_type: 2, route_color: "794500" },
  { route_id: "BR", route_short_name: "BR", route_long_name: "Barrie",          route_type: 2, route_color: "69B143" },
  { route_id: "RH", route_short_name: "RH", route_long_name: "Richmond Hill",   route_type: 2, route_color: "00853F" },
  { route_id: "KI", route_short_name: "KI", route_long_name: "Kitchener",       route_type: 2, route_color: "F5A623" },
  { route_id: "MI", route_short_name: "MI", route_long_name: "Milton",          route_type: 2, route_color: "0070C0" },
  // Buses (major express routes)
  { route_id: "19",  route_short_name: "19",  route_long_name: "Barrie Express",             route_type: 3, route_color: "69B143" },
  { route_id: "30",  route_short_name: "30",  route_long_name: "Highway 10 (Brampton)",      route_type: 3, route_color: "F7941D" },
  { route_id: "31",  route_short_name: "31",  route_long_name: "Airport Express (Brampton)", route_type: 3, route_color: "F7941D" },
  { route_id: "40",  route_short_name: "40",  route_long_name: "Highway 2 (Oshawa)",         route_type: 3, route_color: "EE3124" },
  { route_id: "65",  route_short_name: "65",  route_long_name: "Hwy 10/Hurontario (Mississauga)", route_type: 3, route_color: "009BC9" },
  { route_id: "96",  route_short_name: "96",  route_long_name: "Highway 27 (Woodbridge)",    route_type: 3, route_color: "F7941D" },
];

// GET /v1/routes?type=train|bus
router.get("/", (req: Request, res: Response) => {
  const { type } = req.query;
  let routes = GO_ROUTES;
  if (type === "train") routes = routes.filter((r) => r.route_type === 2);
  if (type === "bus")   routes = routes.filter((r) => r.route_type === 3);
  res.json(routes);
});

export default router;
