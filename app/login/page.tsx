import { ScaffoldPage } from "@/components/scaffold-page";

export default function LoginPage() {
  return (
    <ScaffoldPage
      title="Admin Login"
      description="Login scaffold for the future protected admin area."
      surface="auth"
    >
      <form className="max-w-md space-y-4 rounded-xl border bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium">Username</label>
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            type="text"
            placeholder="admin"
            disabled
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Password</label>
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            type="password"
            placeholder="••••••••"
            disabled
          />
        </div>
        <button
          type="button"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-70"
          disabled
        >
          Sign in (Milestone 2)
        </button>
      </form>
    </ScaffoldPage>
  );
}
