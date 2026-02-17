"use client";

import { useState } from "react";
import type { QueryResponse } from "@/lib/types";

export default function Home() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
      } else {
        setResult(data);
      }
    } catch {
      setError("Failed to connect to the server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">GrammarQL</h1>
      <p className="text-gray-400 mb-8">
        Ask a question about your data in plain English. GPT-5 generates valid
        ClickHouse SQL using a context-free grammar.
      </p>

      <form onSubmit={handleSubmit} className="flex gap-3 mb-8">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. sum the total of all orders placed in the last 30 days"
          className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-medium transition-colors"
        >
          {loading ? "Querying..." : "Run"}
        </button>
      </form>

      {error && (
        <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 mb-6">
          <p className="text-red-300">{error}</p>
        </div>
      )}

      {result && (
        <div className="space-y-6">
          {/* Generated SQL */}
          <div>
            <h2 className="text-sm font-medium text-gray-400 mb-2">Generated SQL</h2>
            <pre className="bg-gray-900 border border-gray-800 rounded-lg p-4 overflow-x-auto text-sm text-green-400">
              {result.sql}
            </pre>
          </div>

          {/* Results Table */}
          <div>
            <h2 className="text-sm font-medium text-gray-400 mb-2">
              Results ({result.data.length} row{result.data.length !== 1 ? "s" : ""})
            </h2>
            {result.data.length > 0 ? (
              <div className="overflow-x-auto border border-gray-800 rounded-lg">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-900">
                      {result.columns.map((col) => (
                        <th
                          key={col}
                          className="text-left px-4 py-2 font-medium text-gray-300 border-b border-gray-800"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.data.map((row, i) => (
                      <tr
                        key={i}
                        className="border-b border-gray-800/50 hover:bg-gray-900/50"
                      >
                        {result.columns.map((col) => (
                          <td key={col} className="px-4 py-2 text-gray-300">
                            {String(row[col] ?? "")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No results returned.</p>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
