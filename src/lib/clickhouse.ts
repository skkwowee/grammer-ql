import { createClient } from "@clickhouse/client";

const client = createClient({
  url: process.env.CLICKHOUSE_HOST,
  username: process.env.CLICKHOUSE_USER || "default",
  password: process.env.CLICKHOUSE_PASSWORD,
});

/**
 * Execute a ClickHouse SQL query and return columns + rows.
 */
export async function executeQuery(
  sql: string
): Promise<{ columns: string[]; data: Record<string, unknown>[] }> {
  if (!process.env.CLICKHOUSE_HOST || !process.env.CLICKHOUSE_PASSWORD) {
    throw new Error("CLICKHOUSE_HOST or CLICKHOUSE_PASSWORD is not configured");
  }

  const result = await client.query({ query: sql, format: "JSON" });
  const json = await result.json<{
    meta: { name: string; type: string }[];
    data: Record<string, unknown>[];
  }>();

  const columns = json.meta.map((m) => m.name);
  return { columns, data: json.data };
}
