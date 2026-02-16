import type { EvalResult, EvalCase } from "@/lib/types";
// TODO: Import generateSQL and validate against the Lark grammar

const cases: EvalCase[] = [
  { name: "Simple count", naturalLanguage: "How many orders are there?" },
  { name: "Sum with filter", naturalLanguage: "What is the total revenue from orders in the last 30 days?" },
  { name: "Group by", naturalLanguage: "Show the number of orders per customer" },
  { name: "Order by desc", naturalLanguage: "Show the top 10 customers by total spending" },
  { name: "Average", naturalLanguage: "What is the average order value?" },
  { name: "Date filter", naturalLanguage: "List all orders placed today" },
  { name: "Multiple conditions", naturalLanguage: "Find orders over $100 placed in the last week" },
  { name: "Min/Max", naturalLanguage: "What was the largest single order?" },
  { name: "Count distinct", naturalLanguage: "How many unique customers have placed orders?" },
  { name: "Like filter", naturalLanguage: "Find all products with 'phone' in the name" },
  { name: "Between", naturalLanguage: "Show orders with amounts between 50 and 200" },
];

/**
 * Eval 1: Generate SQL for each query and verify it parses as valid SQL.
 * TODO: Implement after Features 2-3 are complete.
 */
export async function runSyntacticEval(): Promise<EvalResult[]> {
  return cases.map((c) => ({
    name: c.name,
    passed: false,
    details: "Not implemented yet — complete Features 2-3 first",
  }));
}
