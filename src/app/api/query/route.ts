import { NextRequest, NextResponse } from "next/server";
import { generateSQL } from "@/lib/openai";
import { executeQuery } from "@/lib/clickhouse";
import type { QueryResponse } from "@/lib/types";

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
    const sql = await generateSQL(query);

    // Step 2: Execute the SQL against Tinybird
    const { columns, data } = await executeQuery(sql);

    const response: QueryResponse = { sql, columns, data };
    return NextResponse.json(response);
  } catch (err) {
    console.error("Query error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
