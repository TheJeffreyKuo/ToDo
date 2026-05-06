import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-zinc-900">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold text-center">Create account</h1>
        <label className="block">
          <span className="text-sm text-zinc-600">Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded border px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-sm text-zinc-600">Password</span>
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded border px-3 py-2 text-sm"
          />
          <span className="text-xs text-zinc-500">At least 8 characters</span>
        </label>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-zinc-900 text-white py-2 text-sm disabled:opacity-50"
        >
          {submitting ? "Creating…" : "Create account"}
        </button>
        <div className="text-center text-sm text-zinc-600">
          Already have an account? <Link to="/login" className="underline">Sign in</Link>
        </div>
      </form>
    </div>
  );
}
