#!/bin/bash
#
# Инициализация / наполнение базы PS Pay.
#
# Применяет схему (docker/initdb/01-schema.sql) и сидовые данные
# (docker/initdb/02-seed.sql) к указанной Postgres-базе. Идемпотентно:
# все CREATE TABLE — IF NOT EXISTS, все INSERT — ON CONFLICT DO NOTHING.
#
# Использование:
#   ./scripts/init-db.sh                              # параметры по умолчанию
#   PGHOST=db.internal PGPORT=5432 PGUSER=postgres \
#     PGPASSWORD=secret PGDATABASE=pspay ./scripts/init-db.sh
#
# Или позиционно:
#   ./scripts/init-db.sh <host> <port> <user> <database>
#   (пароль только через PGPASSWORD)
#
# Требуется установленный psql.

set -euo pipefail

PGHOST="${1:-${PGHOST:-localhost}}"
PGPORT="${2:-${PGPORT:-5432}}"
PGUSER="${3:-${PGUSER:-postgres}}"
PGDATABASE="${4:-${PGDATABASE:-pspay}}"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCHEMA="${REPO_ROOT}/docker/initdb/01-schema.sql"
SEED="${REPO_ROOT}/docker/initdb/02-seed.sql"

if ! command -v psql >/dev/null 2>&1; then
    echo "ERROR: psql не установлен. Поставьте postgresql-client." >&2
    exit 1
fi

for f in "$SCHEMA" "$SEED"; do
    if [[ ! -f "$f" ]]; then
        echo "ERROR: не найден файл $f" >&2
        exit 1
    fi
done

export PGPASSWORD="${PGPASSWORD:-postgres}"

echo "→ Target: ${PGUSER}@${PGHOST}:${PGPORT}/${PGDATABASE}"

# 1) Проверить, существует ли база. Если нет — создать.
DB_EXISTS=$(psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d postgres -tAc \
    "SELECT 1 FROM pg_database WHERE datname='${PGDATABASE}'" || true)

if [[ "$DB_EXISTS" != "1" ]]; then
    echo "→ База ${PGDATABASE} не найдена, создаю..."
    psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d postgres \
        -c "CREATE DATABASE ${PGDATABASE}"
fi

# 2) Применить схему.
echo "→ Применяю схему: $(basename "$SCHEMA")"
psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -v ON_ERROR_STOP=1 -f "$SCHEMA"

# 3) Применить сиды.
echo "→ Применяю сиды: $(basename "$SEED")"
psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -v ON_ERROR_STOP=1 -f "$SEED"

# 4) Показать сводку.
echo "→ Готово. Содержимое базы:"
psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -c "
SELECT 'countries' AS table, COUNT(*)::text AS rows FROM countries
UNION ALL SELECT 'directions',     COUNT(*)::text FROM directions
UNION ALL SELECT 'providers',      COUNT(*)::text FROM providers
UNION ALL SELECT 'payment_methods', COUNT(*)::text FROM payment_methods
UNION ALL SELECT 'users',          COUNT(*)::text FROM users
UNION ALL SELECT 'transfers',      COUNT(*)::text FROM transfers
ORDER BY 1;
"

echo
echo "Демо-аккаунт: demo@pspay.ru / demo123"
