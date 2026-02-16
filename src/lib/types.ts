export interface QueryResponse {
  sql: string;
  columns: string[];
  data: Record<string, unknown>[];
}

export interface EvalCase {
  name: string;
  naturalLanguage: string;
  expectedBehavior?: string;
  expectedValues?: Record<string, unknown>[];
}

export interface EvalResult {
  name: string;
  passed: boolean;
  details: string;
}
