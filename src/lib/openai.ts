import OpenAI from "openai";
import { LARK_GRAMMAR } from "./grammar";

let _openai: OpenAI | null = null;
function getClient() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

// Universal reasoning — domain-agnostic, never changes
const REASONING_PROMPT = `You are a precise, conservative SQL analyst working with a ClickHouse database. You prioritize correctness over cleverness — when in doubt, you choose the simpler, more literal interpretation.

YOUR PRINCIPLES:
- Favor the most common business interpretation. "Sales" and "revenue" mean money, "volume" means units. When genuinely ambiguous, prefer the monetary interpretation.
- Be precise with aggregation boundaries. Every non-aggregated column in SELECT must appear in GROUP BY. Never aggregate when the user wants individual rows.
- Treat time as relative to now() unless the user gives absolute dates. "Recent" means ordered by recency. "Last N days" means a sliding window from the current moment.
- Scope results appropriately. If the user asks for "top" or "best", always bound with LIMIT. If they don't specify N, default to 10.
- Never compute what's already computed. If a column represents a derived value, trust it.

Return your query using the clickhouse_sql tool. Only SELECT queries.`;

export interface ColumnSchema {
  name: string;
  type: string;
  description: string;
}

export interface TableSchema {
  name: string;
  description: string;
  columns: ColumnSchema[];
  relationships?: string[];
}

function buildSchemaContext(schema: TableSchema[]): string {
  return schema
    .map((t) => {
      const cols = t.columns
        .map((c) => `- ${c.name} (${c.type}): ${c.description}`)
        .join("\n");
      const rels =
        t.relationships?.length
          ? `\nRELATIONSHIPS:\n${t.relationships.map((r) => `- ${r}`).join("\n")}`
          : "";
      return `TABLE: ${t.name}\n${t.description}\nCOLUMNS:\n${cols}${rels}`;
    })
    .join("\n\n");
}

// Current schema — single source of truth for table metadata
const SCHEMA: TableSchema[] = [
  {
    name: "orders",
    description: "E-commerce order line items",
    columns: [
      { name: "order_id", type: "UInt32", description: "unique identifier per order" },
      { name: "customer_id", type: "String", description: 'e.g. "CUST-0042"' },
      { name: "customer_name", type: "String", description: 'full name, e.g. "Emma Chen"' },
      { name: "product_name", type: "String", description: 'e.g. "Superstrike 2 Wireless Mouse"' },
      {
        name: "category",
        type: "String",
        description: 'one of "Electronics", "Home & Office", "Apparel", "Accessories"',
      },
      { name: "quantity", type: "UInt32", description: "items purchased in this order (usually 1-4)" },
      { name: "unit_price", type: "Float64", description: "price per item in USD" },
      { name: "amount", type: "Float64", description: "total line amount (unit_price * quantity), in USD" },
      { name: "order_date", type: "DateTime", description: "UTC timestamp" },
    ],
  },
];

function buildSystemPrompt(): string {
  return REASONING_PROMPT + "\n\n" + buildSchemaContext(SCHEMA);
}

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
      { role: "system", content: buildSystemPrompt() },
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
