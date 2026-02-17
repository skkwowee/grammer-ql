function getConfig() {
  const host = process.env.CLICKHOUSE_HOST;
  const password = process.env.CLICKHOUSE_PASSWORD;
  if (!host || !password) {
    throw new Error("CLICKHOUSE_HOST or CLICKHOUSE_PASSWORD is not configured");
  }
  return {
    host,
    user: process.env.CLICKHOUSE_USER || "default",
    password,
  };
}

async function query(sql: string): Promise<{
  meta: { name: string; type: string }[];
  data: Record<string, unknown>[];
}> {
  const { host, user, password } = getConfig();
  const url = `${host}/?default_format=JSON`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "X-ClickHouse-User": user,
      "X-ClickHouse-Key": password,
    },
    body: sql,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ClickHouse error: ${text.trim()}`);
  }
  const json = await res.json();
  return { meta: json.meta ?? [], data: json.data ?? [] };
}

/**
 * Validate SQL via ClickHouse EXPLAIN dry-run.
 * Throws with the ClickHouse error message if the query is invalid.
 */
export async function validateQuery(sql: string): Promise<void> {
  try {
    await query(`EXPLAIN ${sql}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`SQL validation failed: ${msg}`);
  }
}

/**
 * Execute a ClickHouse SQL query and return columns + rows.
 */
export async function executeQuery(
  sql: string
): Promise<{ columns: string[]; data: Record<string, unknown>[] }> {
  const result = await query(sql);
  const columns = result.meta.map((m) => m.name);
  return { columns, data: result.data };
}
