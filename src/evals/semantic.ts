import type { EvalResult } from "@/lib/types";
import { generateSQL } from "@/lib/openai";
import { executeQuery } from "@/lib/clickhouse";

interface SemanticCase {
  name: string;
  naturalLanguage: string;
  check: (data: Record<string, unknown>[], columns: string[]) => string | null;
}

const TOTAL_ORDERS = 2000;

const cases: SemanticCase[] = [
  {
    name: "Total order count",
    naturalLanguage: "How many orders are in the dataset?",
    check: (data) => {
      if (data.length !== 1) return `Expected 1 row, got ${data.length}`;
      const val = Number(Object.values(data[0])[0]);
      if (val !== TOTAL_ORDERS) return `Expected ${TOTAL_ORDERS}, got ${val}`;
      return null;
    },
  },
  {
    name: "Sum of a known column",
    naturalLanguage: "What is the total sum of all order amounts?",
    check: (data) => {
      if (data.length !== 1) return `Expected 1 row, got ${data.length}`;
      const val = Number(Object.values(data[0])[0]);
      if (!(val > 0)) return `Expected positive sum, got ${val}`;
      return null;
    },
  },
  {
    name: "Top N query",
    naturalLanguage: "Show the top 5 orders by amount",
    check: (data, columns) => {
      if (data.length !== 5) return `Expected 5 rows, got ${data.length}`;
      const amtCol = columns.find((c) => c.toLowerCase().includes("amount")) ?? columns[columns.length - 1];
      const vals = data.map((r) => Number(r[amtCol]));
      for (let i = 1; i < vals.length; i++) {
        if (vals[i] > vals[i - 1]) return `Rows not in descending order by ${amtCol}`;
      }
      return null;
    },
  },
  {
    name: "Filtered count",
    naturalLanguage: "How many orders are over $100?",
    check: (data) => {
      if (data.length !== 1) return `Expected 1 row, got ${data.length}`;
      const val = Number(Object.values(data[0])[0]);
      if (val <= 0 || val >= TOTAL_ORDERS) return `Expected count between 1 and ${TOTAL_ORDERS - 1}, got ${val}`;
      return null;
    },
  },
  {
    name: "Group by correctness",
    naturalLanguage: "How many orders does each customer have?",
    check: (data) => {
      if (data.length === 0) return "Expected rows, got 0";
      const countCol = Object.keys(data[0]).find((k) =>
        k.toLowerCase().includes("count") || k.toLowerCase().includes("order")
      );
      if (!countCol) return `No count-like column found in: ${Object.keys(data[0]).join(", ")}`;
      const total = data.reduce((s, r) => s + Number(r[countCol]), 0);
      if (total !== TOTAL_ORDERS) return `Group counts sum to ${total}, expected ${TOTAL_ORDERS}`;
      return null;
    },
  },
];

/**
 * Eval 2: Run generated SQL, execute against ClickHouse, check structural properties.
 */
export async function runSemanticEval(): Promise<EvalResult[]> {
  const results: EvalResult[] = [];
  for (const c of cases) {
    try {
      const sql = await generateSQL(c.naturalLanguage);
      const { data, columns } = await executeQuery(sql);
      const failure = c.check(data, columns);
      if (failure) {
        results.push({ name: c.name, passed: false, details: `${failure} | SQL: ${sql}` });
      } else {
        results.push({ name: c.name, passed: true, details: sql });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      results.push({ name: c.name, passed: false, details: msg });
    }
  }
  return results;
}
