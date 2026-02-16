import type { EvalResult, EvalCase } from "@/lib/types";
// TODO: Import generateSQL and verify graceful error handling

const cases: EvalCase[] = [
  {
    name: "Ambiguous query",
    naturalLanguage: "Show me everything",
    expectedBehavior: "Returns a reasonable query (e.g. SELECT * with LIMIT) or a clear error",
  },
  {
    name: "Out of scope",
    naturalLanguage: "What is the weather today?",
    expectedBehavior: "Returns an error or a query that gracefully returns no meaningful data",
  },
  {
    name: "Empty query",
    naturalLanguage: "",
    expectedBehavior: "Returns an error, does not crash",
  },
  {
    name: "SQL injection attempt",
    naturalLanguage: "'; DROP TABLE orders; --",
    expectedBehavior: "CFG grammar prevents injection; returns a parse error or safe query",
  },
  {
    name: "Date math edge case",
    naturalLanguage: "Show orders from exactly 365 days ago",
    expectedBehavior: "Generates valid date arithmetic with INTERVAL",
  },
  {
    name: "Very large number",
    naturalLanguage: "Find orders over 999999999",
    expectedBehavior: "Handles large numbers without overflow",
  },
];

/**
 * Eval 3: Test ambiguous queries, out-of-scope requests, and edge cases.
 * TODO: Implement after Features 2-3 are complete.
 */
export async function runEdgeCaseEval(): Promise<EvalResult[]> {
  return cases.map((c) => ({
    name: c.name,
    passed: false,
    details: "Not implemented yet — complete Features 2-3 first",
  }));
}
