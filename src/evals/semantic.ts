import type { EvalResult, EvalCase } from "@/lib/types";
// TODO: Import generateSQL, executeQuery, and compare results

const cases: EvalCase[] = [
  {
    name: "Total order count",
    naturalLanguage: "How many orders are in the dataset?",
    expectedBehavior: "Returns a single row with a count matching the known dataset size",
  },
  {
    name: "Sum of a known column",
    naturalLanguage: "What is the total sum of all order amounts?",
    expectedBehavior: "Returns the correct sum matching manual calculation",
  },
  {
    name: "Top N query",
    naturalLanguage: "Show the top 5 orders by amount",
    expectedBehavior: "Returns exactly 5 rows in descending order by amount",
  },
  {
    name: "Filtered count",
    naturalLanguage: "How many orders are over $100?",
    expectedBehavior: "Returns a count matching the known number of orders > 100",
  },
  {
    name: "Group by correctness",
    naturalLanguage: "How many orders does each customer have?",
    expectedBehavior: "Groups are correct and counts sum to total order count",
  },
];

/**
 * Eval 2: Run generated SQL and compare output to expected values.
 * TODO: Implement after Features 1-4 are complete and expected values are known.
 */
export async function runSemanticEval(): Promise<EvalResult[]> {
  return cases.map((c) => ({
    name: c.name,
    passed: false,
    details: "Not implemented yet — complete Features 1-4 first",
  }));
}
