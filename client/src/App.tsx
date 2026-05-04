import { useEffect, useState } from "react";

type HealthResponse = { ok: boolean; ts: number };

export default function App() {
  const [state, setState] = useState<
    { kind: "loading" } | { kind: "ok"; data: HealthResponse } | { kind: "error"; message: string }
  >({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/health")
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return (await r.json()) as HealthResponse;
      })
      .then((data) => {
        if (!cancelled) setState({ kind: "ok", data });
      })
      .catch((err) => {
        if (!cancelled) setState({ kind: "error", message: err instanceof Error ? err.message : String(err) });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-zinc-900">
      <div className="w-full max-w-md text-center space-y-3">
        <h1 className="text-2xl font-semibold">ToDo</h1>
        <div className="rounded-lg border bg-white p-4 text-left text-sm font-mono">
          <div className="text-zinc-500 mb-1">GET /api/health</div>
          {state.kind === "loading" && <div>loading…</div>}
          {state.kind === "error" && <div className="text-red-600">error: {state.message}</div>}
          {state.kind === "ok" && <pre className="whitespace-pre-wrap">{JSON.stringify(state.data, null, 2)}</pre>}
        </div>
      </div>
    </div>
  );
}
