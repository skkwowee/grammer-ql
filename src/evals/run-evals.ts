import { runSyntacticEval } from "./syntactic";
import { runSemanticEval } from "./semantic";
import { runEdgeCaseEval } from "./edge-cases";
import type { EvalResult } from "@/lib/types";

async function main() {
  console.log("Running evals...\n");

  const suites: { name: string; run: () => Promise<EvalResult[]> }[] = [
    { name: "Syntactic Validity", run: runSyntacticEval },
    { name: "Semantic Correctness", run: runSemanticEval },
    { name: "Edge Cases & Robustness", run: runEdgeCaseEval },
  ];

  let totalPassed = 0;
  let totalFailed = 0;

  for (const suite of suites) {
    console.log(`\n=== ${suite.name} ===`);
    const results = await suite.run();
    for (const r of results) {
      const icon = r.passed ? "PASS" : "FAIL";
      console.log(`  [${icon}] ${r.name}: ${r.details}`);
      if (r.passed) totalPassed++;
      else totalFailed++;
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`Passed: ${totalPassed}  Failed: ${totalFailed}  Total: ${totalPassed + totalFailed}`);
  process.exit(totalFailed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Eval runner error:", err);
  process.exit(1);
});
