import { NextRequest, NextResponse } from "next/server";
import { generateSQL } from "@/lib/openai";
import { validateQuery, executeQuery } from "@/lib/clickhouse";
import type { QueryResponse } from "@/lib/types";

export const maxDuration = 60;

const MAX_RETRIES = 1;

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'query' field" },
        { status: 400 }
      );
    }

    // Step 1: Generate SQL from natural language using GPT-5 + CFG
    let sql = await generateSQL(query);

    // Step 2: Validate via EXPLAIN dry-run; retry once if it fails
    for (let attempt = 0; ; attempt++) {
      try {
        await validateQuery(sql);
        break;
      } catch (validationErr) {
        if (attempt >= MAX_RETRIES) throw validationErr;
        console.warn(
          `Validation failed (attempt ${attempt + 1}), retrying:`,
          validationErr instanceof Error ? validationErr.message : validationErr
        );
        sql = await generateSQL(query);
      }
    }

    // Step 3: Execute the validated SQL against ClickHouse
    const { columns, data } = await executeQuery(sql);

    const response: QueryResponse = { sql, columns, data };
    return NextResponse.json(response);
  } catch (err) {
    console.error("Query error:", err);
    const message = err instanceof Error
      ? `${err.constructor.name}: ${err.message}`
      : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
