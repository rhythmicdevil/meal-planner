# Deploying

A production `docker compose` stack: `db` (MySQL), `backend` (Spring Boot), `frontend` (nginx,
serving the built app and reverse-proxying `/api/*` to `backend`). The plain `docker-compose.yml`
at the repo root is unrelated to this -- it's just a local-dev convenience file that runs a bare
MySQL container for `./mvnw spring-boot:run` / `npm run dev`.

## First-time setup

```sh
cp .env.example .env
# edit .env: set real DB_PASSWORD, DB_ROOT_PASSWORD, APP_USERNAME, APP_PASSWORD,
# and APP_PORT to a free port on the host.

docker compose -f docker-compose.prod.yml up -d --build
```

The app is then reachable at `http://<host>:${APP_PORT}` (e.g. `http://media-server:8080`),
same as your other self-hosted services -- no need to expose it beyond your Tailscale network.

## Updating after a code change

```sh
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

Flyway migrations run automatically on backend startup; the `meal_planner_db_data` volume
persists across rebuilds and restarts.

## Backup / restore

Use the **Backup** page in the app itself (top nav):
- **Export** downloads a full `.sql` dump of the database (every ingredient, recipe, menu,
  meal plan) to your browser's downloads.
- **Restore** uploads a previously exported file and replaces all current data with it.

## Notes

- The `db` service's port isn't published to the host in this stack -- only `backend` and
  `frontend` can reach it, over the compose network. If you want to connect a DB GUI tool
  directly, add a `ports: ["3306:3306"]` mapping to the `db` service yourself.
- `APP_USERNAME`/`APP_PASSWORD` gate the whole app via HTTP Basic auth (the browser will
  prompt once per session).
