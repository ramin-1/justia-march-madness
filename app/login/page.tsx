import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminLoginForm } from "@/components/admin-login-form";
import { PageShell } from "@/components/page-shell";
import { getAdminUsername, getSafeAdminRedirectPath } from "@/lib/auth/config";

type LoginPageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextParam = Array.isArray(params.next) ? params.next[0] : params.next;
  const safeNextPath = getSafeAdminRedirectPath(nextParam);
  const session = await auth();

  if (session) {
    redirect(safeNextPath);
  }

  return (
    <PageShell
      title="Admin Login"
      description="Credentials-based admin login for protected routes."
    >
      <AdminLoginForm
        defaultUsername={getAdminUsername()}
        callbackUrl={safeNextPath}
      />
    </PageShell>
  );
}
