# Weather Dashboard (Next.js 15 + Prisma + MongoDB)

A minimal yet robust weather dashboard built with Next.js 15 App Router, React 19, Tailwind CSS (v4), shadcn/ui, Prisma, and MongoDB. It fetches weather data from OpenWeather and persists user preferences and cached results for performance and reduced API usage.


## Contents

1. Quick start
2. Environment variables
3. Local database setup (MongoDB)
4. Prisma schema & migrations
5. Scripts
6. Tech stack choices & rationale
7. API documentation
8. Data model
9. Caching strategy
10. Assumptions
11. Known limitations
12. Future improvements


## 1) Quick start

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set environment variables (see section 2). Example `.env.local`:
   ```bash
   # OpenWeather API key (required)
   OPENWEATHER_API_KEY=YOUR_OPENWEATHER_API_KEY
   
   # MongoDB connection (required)
   DATABASE_URL="mongodb://localhost:27017/weather"
   
   # Optional caching TTL in minutes (defaults to 10)
   CACHE_TTL_MINUTES=10
   ```
3. Start MongoDB locally (see section 3) or use MongoDB Atlas.
4. Generate Prisma Client and push schema:
   ```bash
   npm run prisma:generate
   npm run prisma:db:push
   ```
5. Run the dev server:
   ```bash
   npm run dev
   ```
6. Open the app at http://localhost:3000

Node 20+ recommended.


## 2) Environment variables

- OPENWEATHER_API_KEY: string (required)
- DATABASE_URL: string (required) – MongoDB connection string
- CACHE_TTL_MINUTES: number (optional, default: 10)

Security notes:
- Never commit real secrets to source control. Prefer `.env.local` (gitignored).
- OpenWeather quotas apply; rotate keys if compromised.


## 3) Local database setup (MongoDB)

Option A: Docker (quickest)
```bash
# Start MongoDB 7 locally on port 27017
docker run --name weather-mongo -p 27017:27017 -d mongo:7
```
Set `DATABASE_URL` to `mongodb://localhost:27017/weather`.

Option B: MongoDB Atlas
- Create a free cluster and obtain a connection string
- Set `DATABASE_URL` accordingly


## 4) Prisma schema & migrations

- Provider: MongoDB
- Location: `prisma/schema.prisma`
- Apply schema to DB:
  ```bash
  npm run prisma:generate
  npm run prisma:db:push
  ```

This project uses `db push` to sync schema; no SQL migrations are generated for MongoDB.


## 5) Scripts

- `npm run dev` – Start Next.js dev server (Turbopack)
- `npm run build` – Build for production
- `npm run start` – Start production server
- `npm run lint` – Run ESLint
- `npm run lint:fix` – Fix lint issues in `src/`
- `npm run format` – Prettier format `src/`
- `npm run prisma:generate` – Generate Prisma client
- `npm run prisma:db:push` – Push schema to DB


## 6) Tech stack choices & rationale

- **Next.js 15 (App Router)**: Modern routing, server components, simplified API routes and server-only utilities.
- **React 19**: Latest concurrent features and ergonomics.
- **Tailwind CSS v4 + shadcn/ui + Radix primitives**: Rapid, accessible UI development with composable components.
- **Prisma (provider: MongoDB)**: Type-safe data access with a flexible document database. Mongo is sufficient for the simple data model (cities, preferences, cache) and easy to run locally.
- **OpenWeather APIs**: Reliable, well-documented public weather API with both current and forecast data and a One Call 3.0 endpoint for hourly/daily and alerts.
- **Server-only weather library** (`src/lib/weather.ts`): Encapsulates calls, adds caching, DB persistence, and error handling.


## 7) API documentation

All routes reside under `/src/app/api/*` and use Next.js App Router request handlers.

### 7.1 GET /api/weather
Fetches current weather and 5-day forecast for a city.

Query params:
- `q` (required) – city query; supports `City` or `City,CC` (two-letter country code)
- `search` (optional) – if provided, returns geocoding search results instead of weather

Responses:
- On `search`: `{ results: [{ name, country, lat, lon }, ...] }`
- On `q`: `{ current, forecast }`

Example:
```
GET /api/weather?q=Paris,FR
GET /api/weather?search=San
```

Notes:
- Uses `getCurrentWeatherForCity` and `getForecastForCity` from `src/lib/weather.ts`
- Metric units returned by default (Celsius, m/s from API; UI displays km/h)

### 7.2 GET /api/weather/alerts
Retrieves One Call 3.0 data (alerts, 24h hourly, 7-day daily) for coordinates.

Query params:
- `lat` (required)
- `lon` (required)

Response shape:
```
{
  alerts: [ ... ] | [],
  current: { ... },
  hourly: [ ... up to 24 items ... ],
  daily: [ ... up to 7 items ... ]
}
```

Example:
```
GET /api/weather/alerts?lat=48.8566&lon=2.3522
```

Notes:
- Requires One Call 3.0 access on your OpenWeather account.

### 7.3 Favorites – Cities API

- `GET /api/cities` → `{ cities: [{ id, name, country, lat?, lon? }, ...] }`
- `POST /api/cities` with JSON body `{ name: string, country?: string }` → `{ city }` (201)
- `DELETE /api/cities?cityId=...` → `{ success: true }`
- `DELETE /api/cities/[id]` → `{ ok: true }`

Notes:
- City uniqueness: `(name, country)` pair
- A single demo "user" is represented by `UserPreference` with id `default`


## 8) Data model (Prisma)

- `City`: `{ id, name, country, lat?, lon?, createdAt }`
- `UserPreference`: single demo record `{ id: 'default', createdAt, updatedAt }`
- `FavoriteCity`: join between `UserPreference` and `City` with `order`
- `WeatherCache`: per-city cached payloads for `current` and `forecast` with `expiresAt`

See `prisma/schema.prisma` for full definitions and indexes.


## 9) Caching strategy

- DB-backed caching of OpenWeather responses in `WeatherCache`
- Keys: `(cityId, type)` where type ∈ {`current`, `forecast`}
- TTL: default 10 minutes (configurable via `CACHE_TTL_MINUTES`)
- Benefits: reduces API calls, improves perceived performance
- One Call 3.0 route (`/api/weather/alerts`) is not cached in DB; it’s fetched fresh per request.


## 10) Assumptions

- Single-user demo app using `UserPreference` with id `default` (no auth integration).
- Metric units for temperature and speed; UI converts wind to km/h where needed.
- Country codes are optional; when provided, two-letter uppercase is expected (e.g., `US`, `FR`).
- The UI primarily targets desktop and modern browsers; basic mobile responsiveness via Tailwind/shadcn.
- API error handling returns JSON `{ error: string }` with relevant HTTP status codes.


## 11) Known limitations

- No authentication or multi-user segregation; all favorites are tied to a single demo preference.
- Rate limiting is not implemented on API routes; heavy use could hit OpenWeather quotas.
- Limited validation and i18n; responses are in English and metric.
- The One Call 3.0 endpoint requires an appropriate OpenWeather subscription/tier.
- No E2E or unit tests included yet.
- Reorder API endpoint previously existed but was unused; it has been removed for cleanliness.


## 12) Future improvements

- Add authentication and per-user preferences.
- Implement API rate limiting and request deduplication.
- Add robust error telemetry (e.g., Sentry) and retries with exponential backoff for transient failures.
- Expand caching to include One Call hourly/daily with proper invalidation.
- Add tests (unit/integration/E2E) and CI workflows.
- Improve accessibility and mobile UX polish.
- Add localization (units, language) and theme customization.
- Implement city reorder API and drag/drop persistence.
- Add background jobs to refresh cache proactively.


## Project structure (selected)

```
src/
  app/
    api/
      cities/
        [id]/route.ts
        route.ts
      weather/
        alerts/route.ts
        route.ts
    page.tsx
    layout.tsx
  components/
    weather/
      HourlyForecast.tsx
    ui/ ... (shadcn components)
  lib/
    prisma.ts
    utils.ts
    weather.ts
prisma/
  schema.prisma
```


## License

MIT. See `LICENSE.md`.