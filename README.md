# cookies-app

A personal cookbook and baking app. It's a Progressive Web App (PWA) that works on phone and desktop, can be installed on the home screen, and keeps recipes available offline. It's for personal use only, so there are no logins or user accounts.

**Features**

- Recipes with a photo (camera or gallery), servings, time, a 1–5 star rating and Markdown instructions
- Any number of ingredient groups (e.g. *Base*, *Filling*, *Topping*) that you can rename, reorder and delete
- An ingredient catalog with autocomplete, so "flour" is spelled the same everywhere
- `#tags` with autocomplete. A `#tag` written in the instructions is clickable too
- Full-text search (Postgres), filters for tags (AND), minimum rating and ingredient, and sorting
- A shopping list built from several recipes, with servings scaling, combined amounts, unit normalization (g/kg, ml/l, tsp/tbsp), grouping by category, check-off, manual items and sharing
- Cooking mode: large text, ingredients you can tick off, and the screen stays on (Wake Lock API)
- JSON export and import of all recipes, with images embedded as Base64
- German by default, with a language switch (DE/EN) in the header and in Settings. The choice is remembered on each device
- A Christmas theme (berry red, pine green and gold, fairy lights and falling snow) with a dark mode. Snowfall can be turned off in Settings and is hidden automatically when the device prefers reduced motion

**Tech stack:** React + TypeScript + Vite + Tailwind CSS (client), Node.js + TypeScript + Hono (REST API under `/api`), PostgreSQL + Drizzle ORM (migrations), and sharp (images resized to max 1200 px and saved as WebP). Everything runs as one service: the server also serves the built frontend.

```
client/   React PWA (Vite)
server/   Hono API, Drizzle schema + migrations (server/drizzle), seed script, unit tests
```

## Configuration

The app reads its configuration **only from environment variables**:

| Variable       | Description                                              |
| -------------- | -------------------------------------------------------- |
| `DATABASE_URL` | PostgreSQL connection string                             |
| `PORT`         | HTTP port (the server listens on `0.0.0.0`)              |
| `UPLOAD_DIR`   | Folder for uploaded images (on Railway: `/data/uploads`) |

Use [`.env.example`](.env.example) as a template for local development. **Never commit `.env`.**

## Run locally

Requirements: Node.js 20.19+ (22 recommended), Docker, and [gitleaks](https://github.com/gitleaks/gitleaks#installing), which the pre-commit hook needs.

```bash
cp .env.example .env          # placeholder values for the local database
docker compose up -d          # starts Postgres with the credentials from .env
npm install
npm run seed                  # optional: adds 5 German sample recipes
npm run dev                   # API on :3000, app on http://localhost:5173
```

The database migrations run automatically every time the server starts.

Other commands:

```bash
npm test               # unit tests (unit conversion and shopping list combining)
npm run build          # builds client and server
npm start              # runs the production build (serves the app on $PORT)
npm run db:generate    # creates a new migration after changing server/src/db/schema.ts
```

To try the production build locally, export the variables from `.env` in your shell, then run `npm run build && npm start`.

## Deploy to Railway

The repository includes [`railway.json`](railway.json). It contains only the build command, the start command and the health check (`/api/health`). **All variables are set in the Railway dashboard.**

1. **Create the project.** On [railway.com](https://railway.com), click **New Project → Deploy from GitHub repo** and choose `rodrigorbenitez/cookies-app`. If asked, allow Railway to access the repository. The first deploy may fail until the next steps are done. That's expected.
2. **Add Postgres.** In the project canvas, click **Create → Database → PostgreSQL**.
3. **Attach a volume.** Right-click the app service (not the database), choose **Attach volume**, and set the mount path to **`/data`**.
4. **Set the variables.** Open the app service, go to **Variables**, and add:
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}` (a reference to the Postgres service, so you never paste the real connection string)
   - `UPLOAD_DIR` = `/data/uploads`
   - `PORT` is provided by Railway automatically. You don't need to set it.
5. **Deploy.** Railway builds with `npm run build` and starts with `npm run start`. On start, the server runs the database migrations and then begins listening. Railway waits until `/api/health` reports OK.
6. **Get a URL.** Under the app service, go to **Settings → Networking** and click **Generate Domain**. Open that URL on your phone to install the app (see below).
7. **Optional: copy the sample recipes.** Run the app locally with `npm run seed`, click **Settings → Export JSON**, and import that file in the deployed app under **Settings → Import JSON**. This works for moving any recipes between instances.

Every push to `main` deploys again automatically.

> Images are stored on the volume and only their file names are stored in the database. Use **Settings → Export JSON** in the app for regular backups. The export contains all recipes and images.

## Install on your phone

- **Android (Chrome):** open the app URL, tap **⋮ → Install app** (or **Add to Home screen**).
- **iPhone (Safari):** open the app URL, tap **Share → Add to Home Screen**.

The app opens full-screen. Recipes you have opened while online stay available offline, and the recipe list preloads every recipe once per session.

## Security (public repository)

- No secrets, connection strings, URLs or passwords are stored in the code, config files, tests, seed data or this README. Everything comes from environment variables. Only `.env.example`, with placeholders, is committed.
- `docker-compose.yml` reads the local database credentials from your `.env`.
- Uploaded images, `data/`, `uploads/`, JSON exports and database dumps are git-ignored.
- In production, the API never returns stack traces or database errors to the client, and environment variables are never logged.
- **gitleaks** runs as a pre-commit hook (husky) and as a GitHub Action on every push and pull request (`.github/workflows/gitleaks.yml`). Run `npm run secrets:scan` to scan the full history manually.

**Please turn these on in GitHub:** go to **Settings → Code security** (called *Security & analysis* on older UIs) and enable **Secret scanning** and **Push protection**.
