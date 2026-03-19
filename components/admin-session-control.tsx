import { auth, signOut } from "@/auth";

export async function AdminSessionControl() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  async function logoutAction() {
    "use server";
    await signOut({ redirectTo: "/leaderboard" });
  }

  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Log out
      </button>
    </form>
  );
}
