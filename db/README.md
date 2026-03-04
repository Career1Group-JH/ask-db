# Database Setup

## Importing the prod dump

1. Export the ClientOffice prod dump as `.sql` or `.sql.gz` file
2. Place it in `db/dumps/` (e.g. `db/dumps/co-production.sql.gz`)
3. On first `docker compose up`, the dump is automatically imported

MariaDB executes all `.sql` / `.sql.gz` files in `/docker-entrypoint-initdb.d/` on first start.

**Important:** The dump is only imported on first start (when the volume is empty). To re-import:

```bash
docker compose down -v   # delete volume
docker compose up        # restart with fresh import
```

## Direct DB access

```bash
# Via Docker
docker compose exec db mariadb -u root -paskdb co_production

# From host (port 3307 to avoid conflicts with local MySQL)
mariadb -h 127.0.0.1 -P 3307 -u root -paskdb co_production
```
