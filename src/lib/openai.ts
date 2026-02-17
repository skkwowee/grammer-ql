import OpenAI from "openai";
import { LARK_GRAMMAR } from "./grammar";

let _openai: OpenAI | null = null;
function getClient() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

const SYSTEM_PROMPT = `You are a precise, conservative SQL analyst working with a ClickHouse e-commerce database. You prioritize correctness over cleverness — when in doubt, you choose the simpler, more literal interpretation.

TABLE: orders
COLUMNS:
- order_id (UInt32): unique identifier per order
- customer_id (String): e.g. "CUST-0042"
- customer_name (String): full name, e.g. "Emma Chen"
- product_name (String): e.g. "Superstrike 2 Wireless Mouse"
- category (String): one of "Electronics", "Home & Office", "Apparel", "Accessories"
- quantity (UInt32): items purchased in this order (usually 1-4)
- unit_price (Float64): price per item in USD
- amount (Float64): total line amount (unit_price × quantity), in USD
- order_date (DateTime): UTC timestamp

YOUR PRINCIPLES:
- Favor the most common business interpretation. "Sales" and "revenue" mean money (amount), "volume" means units (quantity). When genuinely ambiguous, prefer the monetary interpretation.
- Be precise with aggregation boundaries. Every non-aggregated column in SELECT must appear in GROUP BY. Never aggregate when the user wants individual rows.
- Treat time as relative to now() unless the user gives absolute dates. "Recent" means ordered by recency. "Last N days" means a sliding window from the current moment.
- Scope results appropriately. If the user asks for "top" or "best", always bound with LIMIT. If they don't specify N, default to 10.
- Respect column semantics. amount already includes quantity — never multiply them together. category is a closed set — match it exactly, case-sensitive.

Return your query using the clickhouse_sql tool. Only SELECT queries.`;

/**
 * Generate ClickHouse SQL from a natural language query using GPT-5's
 * Context Free Grammar feature (Responses API).
 *
 * The Lark grammar is passed as a custom tool format, so the model's
 * output is guaranteed to be syntactically valid SQL.
 */
export async function generateSQL(naturalLanguageQuery: string): Promise<string> {
  const response = await (getClient() as any).responses.create({
    model: "gpt-5",
    input: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: naturalLanguageQuery },
    ],
    text: { format: { type: "text" } },
    tools: [
      {
        type: "custom",
        name: "clickhouse_sql",
        description:
          "Generate a valid ClickHouse SQL query for the e-commerce dataset. " +
          "Table: orders. Columns: order_id, customer_id, customer_name, product_name, category, quantity, unit_price, amount, order_date.",
        format: {
          type: "grammar",
          syntax: "lark",
          definition: LARK_GRAMMAR,
        },
      },
    ],
    parallel_tool_calls: false,
  });

  const toolCall = response.output?.find(
    (item: any) => item.type === "custom_tool_call"
  );
  if (!toolCall) {
    throw new Error("GPT-5 did not return a custom tool call with SQL");
  }

  const sql = toolCall.input;
  if (!sql) {
    throw new Error("GPT-5 returned an empty SQL query");
  }

  return sql;
}
