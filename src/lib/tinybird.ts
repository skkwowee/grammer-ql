const TINYBIRD_TOKEN = process.env.TINYBIRD_TOKEN;
const TINYBIRD_HOST = process.env.TINYBIRD_HOST || "https://api.us-east.tinybird.co";

interface TinybirdResponse {
  data: Record<string, unknown>[];
  meta: { name: string; type: string }[];
  rows: number;
  statistics: { elapsed: number; rows_read: number; bytes_read: number };
}

/**
 * Execute a ClickHouse SQL query against Tinybird's SQL API.
 */
export async function executeQuery(
  sql: string
): Promise<{ columns: string[]; data: Record<string, unknown>[] }> {
  if (!TINYBIRD_TOKEN) {
    throw new Error("TINYBIRD_TOKEN is not configured");
  }

  const url = `${TINYBIRD_HOST}/v0/sql`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TINYBIRD_TOKEN}`,
      "Content-Type": "text/plain",
    },
    body: `${sql} FORMAT JSON`,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Tinybird query failed (${res.status}): ${text}`);
  }

  const result: TinybirdResponse = await res.json();
  const columns = result.meta.map((m) => m.name);

  return { columns, data: result.data };
}
