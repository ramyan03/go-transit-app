import { Router, Request, Response } from "express";

const router = Router();

// Major GO Train stations — populated from GTFS stops.txt.
// Buses and full stop list will come from the GTFS static pipeline.
const GO_STATIONS = [
  { stop_id: "UN",  stop_name: "Union Station",          stop_lat: 43.6452, stop_lon: -79.3806, wheelchair_boarding: 1 },
  { stop_id: "EX",  stop_name: "Exhibition",              stop_lat: 43.6364, stop_lon: -79.4184, wheelchair_boarding: 1 },
  { stop_id: "MI",  stop_name: "Mimico",                  stop_lat: 43.6148, stop_lon: -79.4876, wheelchair_boarding: 1 },
  { stop_id: "PO",  stop_name: "Port Credit",             stop_lat: 43.5513, stop_lon: -79.5822, wheelchair_boarding: 1 },
  { stop_id: "CL",  stop_name: "Clarkson",                stop_lat: 43.5079, stop_lon: -79.6358, wheelchair_boarding: 1 },
  { stop_id: "OA",  stop_name: "Oakville",                stop_lat: 43.4673, stop_lon: -79.6802, wheelchair_boarding: 1 },
  { stop_id: "BU",  stop_name: "Bronte",                  stop_lat: 43.4437, stop_lon: -79.7190, wheelchair_boarding: 1 },
  { stop_id: "AJ",  stop_name: "Appleby",                 stop_lat: 43.4229, stop_lon: -79.7680, wheelchair_boarding: 1 },
  { stop_id: "BI",  stop_name: "Burlington",              stop_lat: 43.3990, stop_lon: -79.8013, wheelchair_boarding: 1 },
  { stop_id: "AL",  stop_name: "Aldershot",               stop_lat: 43.3357, stop_lon: -79.8597, wheelchair_boarding: 1 },
  { stop_id: "HA",  stop_name: "Hamilton",                stop_lat: 43.2557, stop_lon: -79.8711, wheelchair_boarding: 1 },
  { stop_id: "WE",  stop_name: "West Harbour (Hamilton)", stop_lat: 43.2657, stop_lon: -79.8813, wheelchair_boarding: 1 },
  // Lakeshore East
  { stop_id: "DA",  stop_name: "Danforth",                stop_lat: 43.6894, stop_lon: -79.3107, wheelchair_boarding: 1 },
  { stop_id: "SC",  stop_name: "Scarborough",             stop_lat: 43.7126, stop_lon: -79.2354, wheelchair_boarding: 1 },
  { stop_id: "EG",  stop_name: "Eglinton",                stop_lat: 43.7166, stop_lon: -79.2022, wheelchair_boarding: 1 },
  { stop_id: "GU",  stop_name: "Guildwood",               stop_lat: 43.7279, stop_lon: -79.1876, wheelchair_boarding: 1 },
  { stop_id: "RO",  stop_name: "Rouge Hill",              stop_lat: 43.8006, stop_lon: -79.1342, wheelchair_boarding: 1 },
  { stop_id: "PI",  stop_name: "Pickering",               stop_lat: 43.8315, stop_lon: -79.0867, wheelchair_boarding: 1 },
  { stop_id: "AX",  stop_name: "Ajax",                    stop_lat: 43.8462, stop_lon: -79.0363, wheelchair_boarding: 1 },
  { stop_id: "WH",  stop_name: "Whitby",                  stop_lat: 43.8688, stop_lon: -78.9432, wheelchair_boarding: 1 },
  { stop_id: "OS",  stop_name: "Oshawa",                  stop_lat: 43.8991, stop_lon: -78.8594, wheelchair_boarding: 1 },
  // Stouffville
  { stop_id: "KE",  stop_name: "Kennedy",                 stop_lat: 43.7314, stop_lon: -79.2635, wheelchair_boarding: 1 },
  { stop_id: "AG",  stop_name: "Agincourt",               stop_lat: 43.7764, stop_lon: -79.2748, wheelchair_boarding: 1 },
  { stop_id: "MK",  stop_name: "Markham",                 stop_lat: 43.8680, stop_lon: -79.2626, wheelchair_boarding: 1 },
  { stop_id: "UI",  stop_name: "Unionville",              stop_lat: 43.8517, stop_lon: -79.3112, wheelchair_boarding: 1 },
  { stop_id: "CE",  stop_name: "Centennial",              stop_lat: 43.8680, stop_lon: -79.3430, wheelchair_boarding: 1 },
  { stop_id: "MO",  stop_name: "Mount Joy",               stop_lat: 43.8885, stop_lon: -79.3205, wheelchair_boarding: 1 },
  { stop_id: "ST",  stop_name: "Stouffville",             stop_lat: 43.9705, stop_lon: -79.2540, wheelchair_boarding: 1 },
  // Barrie
  { stop_id: "BD",  stop_name: "Bloor",                   stop_lat: 43.6651, stop_lon: -79.4200, wheelchair_boarding: 1 },
  { stop_id: "WO",  stop_name: "Weston",                  stop_lat: 43.7068, stop_lon: -79.5177, wheelchair_boarding: 1 },
  { stop_id: "ET",  stop_name: "Etobicoke North",         stop_lat: 43.7322, stop_lon: -79.5594, wheelchair_boarding: 1 },
  { stop_id: "ML",  stop_name: "Malton",                  stop_lat: 43.7211, stop_lon: -79.6225, wheelchair_boarding: 1 },
  { stop_id: "BR",  stop_name: "Brampton",                stop_lat: 43.6836, stop_lon: -79.7596, wheelchair_boarding: 1 },
  { stop_id: "MT",  stop_name: "Mount Pleasant",          stop_lat: 43.6737, stop_lon: -79.8185, wheelchair_boarding: 1 },
  { stop_id: "GE",  stop_name: "Georgetown",              stop_lat: 43.6513, stop_lon: -79.9209, wheelchair_boarding: 1 },
  { stop_id: "AN",  stop_name: "Acton",                   stop_lat: 43.6335, stop_lon: -80.0356, wheelchair_boarding: 0 },
  { stop_id: "GO",  stop_name: "Guelph Central",          stop_lat: 43.5460, stop_lon: -80.2484, wheelchair_boarding: 1 },
  // Richmond Hill
  { stop_id: "OR",  stop_name: "Old Cummer",              stop_lat: 43.7859, stop_lon: -79.3846, wheelchair_boarding: 1 },
  { stop_id: "LA",  stop_name: "Langstaff",               stop_lat: 43.8425, stop_lon: -79.4229, wheelchair_boarding: 1 },
  { stop_id: "RH",  stop_name: "Richmond Hill",           stop_lat: 43.8707, stop_lon: -79.4340, wheelchair_boarding: 1 },
  // Kitchener / Barrie (more)
  { stop_id: "AU",  stop_name: "Aurora",                  stop_lat: 44.0074, stop_lon: -79.4501, wheelchair_boarding: 1 },
  { stop_id: "NE",  stop_name: "Newmarket",               stop_lat: 44.0581, stop_lon: -79.4608, wheelchair_boarding: 1 },
  { stop_id: "EA",  stop_name: "East Gwillimbury",        stop_lat: 44.1007, stop_lon: -79.4597, wheelchair_boarding: 1 },
  { stop_id: "BA",  stop_name: "Bradford",                stop_lat: 44.1147, stop_lon: -79.5599, wheelchair_boarding: 1 },
  { stop_id: "BB",  stop_name: "Barrie South",            stop_lat: 44.3568, stop_lon: -79.6893, wheelchair_boarding: 1 },
  { stop_id: "BC",  stop_name: "Barrie Allandale Waterfront", stop_lat: 44.3930, stop_lon: -79.6766, wheelchair_boarding: 1 },
];

// GET /v1/stops?query=...
router.get("/", (req: Request, res: Response) => {
  const query = typeof req.query.query === "string" ? req.query.query.toLowerCase() : null;
  const stops = query
    ? GO_STATIONS.filter((s) => s.stop_name.toLowerCase().includes(query))
    : GO_STATIONS;
  res.json(stops);
});

// GET /v1/stops/:id
router.get("/:id", (req: Request, res: Response) => {
  const stop = GO_STATIONS.find(
    (s) => s.stop_id.toLowerCase() === req.params.id.toLowerCase()
  );
  if (!stop) {
    return res.status(404).json({ error: "not_found", message: `Stop ${req.params.id} not found`, status: 404 });
  }
  res.json(stop);
});

export default router;
