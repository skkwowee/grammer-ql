import OpenAI from "openai";
import { LARK_GRAMMAR } from "./grammar";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Generate ClickHouse SQL from a natural language query using GPT-5's
 * Context Free Grammar feature.
 *
 * The Lark grammar is passed as a custom tool format, so the model's
 * output is guaranteed to be syntactically valid SQL.
 */
export async function generateSQL(naturalLanguageQuery: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-5",
    messages: [
      {
        role: "system",
        content:
          "You are a SQL assistant. Given a natural language question about an e-commerce dataset, generate a valid ClickHouse SQL query. Use the clickhouse_sql tool to return your query.",
      },
      {
        role: "user",
        content: naturalLanguageQuery,
      },
    ],
    tools: [
      {
        // @ts-expect-error — GPT-5 custom tool type not yet in openai SDK types
        type: "custom",
        name: "clickhouse_sql",
        description: "Generate a valid ClickHouse SQL query for the e-commerce dataset",
        format: {
          type: "grammar",
          syntax: "lark",
          definition: LARK_GRAMMAR,
        },
      },
    ],
  });

  const toolCall = response.choices[0]?.message?.tool_calls?.[0];
  if (!toolCall) {
    throw new Error("GPT-5 did not return a tool call with SQL");
  }

  const sql = toolCall.function.arguments;
  if (!sql) {
    throw new Error("GPT-5 returned an empty SQL query");
  }

  return sql;
}
