import OpenAI from "openai";
import { LARK_GRAMMAR } from "./grammar";

let _openai: OpenAI | null = null;
function getClient() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

const SYSTEM_PROMPT =
  "You are a SQL assistant. Given a natural language question about an e-commerce orders dataset, generate a valid ClickHouse SQL query. " +
  "The table is called `orders` with columns: order_id, customer_id, customer_name, product_name, category, quantity, unit_price, amount, order_date. " +
  "Use the clickhouse_sql tool to return your query.";

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
