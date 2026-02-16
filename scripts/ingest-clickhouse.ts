/**
 * Create the orders table and ingest orders.csv into ClickHouse Cloud.
 * Run: npx tsx scripts/ingest-clickhouse.ts
 */

import { createClient } from "@clickhouse/client";
import { readFileSync } from "fs";
import { join } from "path";
import { parse } from "dotenv";

const envFile = readFileSync(join(__dirname, "..", ".env.local"), "utf-8");
const env = parse(envFile);

const client = createClient({
  url: env.CLICKHOUSE_HOST,
  username: env.CLICKHOUSE_USER || "default",
  password: env.CLICKHOUSE_PASSWORD,
});

async function main() {
  if (!env.CLICKHOUSE_HOST || !env.CLICKHOUSE_PASSWORD) {
    console.error("Missing CLICKHOUSE_HOST or CLICKHOUSE_PASSWORD in .env.local");
    process.exit(1);
  }

  console.log(`Connecting to ${env.CLICKHOUSE_HOST}...`);

  // Drop table if exists (idempotent re-runs)
  await client.command({
    query: "DROP TABLE IF EXISTS orders",
  });
  console.log("Dropped existing orders table (if any).");

  // Create table
  await client.command({
    query: `
      CREATE TABLE orders (
        order_id UInt32,
        customer_id String,
        customer_name String,
        product_name String,
        category String,
        quantity UInt32,
        unit_price Float64,
        amount Float64,
        order_date DateTime
      ) ENGINE = MergeTree()
      ORDER BY (order_date, order_id)
    `,
  });
  console.log("Created orders table.");

  // Read CSV and insert via HTTP API (the JS client doesn't support raw CSV insert)
  const csvPath = join(__dirname, "..", "data", "orders.csv");
  const csv = readFileSync(csvPath);

  const url = `${env.CLICKHOUSE_HOST}/?query=${encodeURIComponent("INSERT INTO orders FORMAT CSVWithNames")}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${env.CLICKHOUSE_USER || "default"}:${env.CLICKHOUSE_PASSWORD}`).toString("base64")}`,
    },
    body: csv,
  });
  if (!res.ok) {
    throw new Error(`Insert failed (${res.status}): ${await res.text()}`);
  }
  console.log("Inserted CSV data.");

  // Verify
  const result = await client.query({
    query: "SELECT count() as total, min(order_date) as earliest, max(order_date) as latest FROM orders",
    format: "JSONEachRow",
  });
  const rows = await result.json<{ total: string; earliest: string; latest: string }[]>();
  if (rows[0]) {
    console.log(`Rows: ${rows[0].total} | Date range: ${rows[0].earliest} → ${rows[0].latest}`);
  }

  await client.close();
  console.log("Done!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
