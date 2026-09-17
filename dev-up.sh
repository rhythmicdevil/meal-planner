#!/usr/bin/env bash
# Starts the meal-planner dev stack: db (Docker Compose), backend (Spring Boot), frontend (Vite).
# Logs and PIDs go to .dev-logs/.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$ROOT_DIR/.dev-logs"
mkdir -p "$LOG_DIR"

APP_USERNAME="${APP_USERNAME:-admin}"
APP_PASSWORD="${APP_PASSWORD:-changeme}"

wait_for_http() {
  local url=$1 name=$2 auth=${3:-}
  echo "Waiting for $name..."
  for _ in $(seq 1 60); do
    if curl -s -o /dev/null -w '%{http_code}' ${auth:+-u "$auth"} "$url" 2>/dev/null | grep -q '^200$'; then
      echo "$name is up."
      return 0
    fi
    sleep 2
  done
  echo "Timed out waiting for $name" >&2
  return 1
}

echo "==> Starting database..."
(cd "$ROOT_DIR" && docker compose up -d db)

echo "==> Starting backend..."
(cd "$ROOT_DIR/backend" && nohup ./mvnw spring-boot:run > "$LOG_DIR/backend.log" 2>&1 & echo $! > "$LOG_DIR/backend.pid")
wait_for_http "http://localhost:8080/api/recipes" "backend" "$APP_USERNAME:$APP_PASSWORD"

echo "==> Starting frontend..."
(cd "$ROOT_DIR/frontend" && nohup npx vite --port 5173 > "$LOG_DIR/frontend.log" 2>&1 & echo $! > "$LOG_DIR/frontend.pid")
wait_for_http "http://localhost:5173/" "frontend"

cat <<EOF

All services started:
  Frontend: http://localhost:5173
  Backend:  http://localhost:8080 (basic auth: $APP_USERNAME/$APP_PASSWORD)
  Logs:     $LOG_DIR/
  PIDs:     $LOG_DIR/backend.pid, $LOG_DIR/frontend.pid

To stop: kill \$(cat "$LOG_DIR/backend.pid") \$(cat "$LOG_DIR/frontend.pid") && docker compose stop db
EOF
