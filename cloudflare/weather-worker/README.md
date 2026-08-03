# Boho News weather edge

This undeployed Worker serves the built static site and handles
`/api/weather/v1/*` first. It never exposes the Pi.

## Local preview

```sh
npm ci
npm run weather:preview
```

Phase 4/5 routes add:

- `/api/weather/v1/radar/manifest` — up to two hours / 60 timestamped NOAA MRMS frames, including observed cadence and history metadata.
- `/api/weather/v1/radar/image.png?time=…&west=…&south=…&east=…&north=…&width=…&height=…` — one cached, viewport-sized observed-radar image per animation frame.
- `/api/weather/v1/radar/tiles/{z}/{x}/{y}.png?time=…` — cached, same-origin observed-radar tiles.
- `/api/weather/v1/forecast/precipitation/image.png?frame=…&west=…&south=…&east=…&north=…&width=…&height=…` — one viewport-sized WPC forecast image per frame.
- `/api/weather/v1/map/base/{z}/{x}/{y}` — cached USGS The National Map tiles.
- `/api/weather/v1/warnings?lat=…&lon=…` — allowlisted NWS warning geometry for the selected point.

The public weather contract is version 1.3.1 and includes nullable precipitation
amount, humidity, dew point, cloud cover, and pressure on hourly periods. Radar
remains CONUS-only; global point forecasts use MET Norway where NWS coverage is
unavailable.

The radar client keeps three same-origin viewport-image surfaces in rotation. A
frame is one upstream image request instead of a grid of independent requests.
It warms the next visible frame before playback, crossfades loaded surfaces, pauses in hidden
tabs, exposes speed and latest-frame controls, and disables motion effects when
the visitor requests reduced motion. Crossfades are visual transitions between
real observations; they are not represented as additional observations.

Local Wrangler persists development KV, R2, and D1 state. Because
`request.cf` geolocation exists only on Cloudflare's network, local development
uses a clearly labeled approximate Chicago fallback.

## Authorized deployment checklist

1. Review a clean, exact commit and the governed production edge-router contract.
2. Provision the declared `WEATHER_CACHE`, `WEATHER_ASSETS`, and
   `WEATHER_LOCATIONS` bindings in the intended Cloudflare account. The config
   intentionally contains no account or resource IDs.
3. Apply `migrations/0001_locations.sql` and import the reviewed
   GeoNames-derived gazetteer.
4. Do not add keyed providers until their publication-rights records are
   approved. Add any later credentials only as encrypted Worker secrets.
5. Verify health, location context, U.S. and global forecasts, coordinate
   validation, cache behavior, static assets, privacy, and rollback.
6. Route the exact accepted Worker version behind the existing governed edge
   layer. Deployment, route, DNS, and account mutations require separate owner
   approval.

The initial public path uses NWS in the United States and MET Norway globally.
Visitor IP addresses are not returned, forwarded to providers, or persisted.
