import { PageShell } from "@/components/page-shell";

export default function LoginPage() {
  return (
    <PageShell
      title="Admin Login"
      description="Placeholder login route for the protected admin area."
    >
      <form className="max-w-md space-y-4 rounded-xl border bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium">Username</label>
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            type="text"
            placeholder="admin"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Password</label>
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            type="password"
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          Sign in
        </button>
      </form>
    </PageShell>
  );
}
