export const DEFAULT_ADMIN_REDIRECT_PATH = "/entries";

export function assertAuthEnvironment() {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  if (!process.env.AUTH_SECRET?.trim()) {
    throw new Error("AUTH_SECRET must be configured in production.");
  }

  if (!process.env.ADMIN_PASSWORD_HASH?.trim()) {
    throw new Error("ADMIN_PASSWORD_HASH must be configured in production.");
  }
}

export function getAdminUsername() {
  return process.env.ADMIN_USERNAME ?? "admin";
}

export function requireConfiguredAdminPasswordHash() {
  const hash = process.env.ADMIN_PASSWORD_HASH;

  if (!hash) {
    throw new Error("ADMIN_PASSWORD_HASH is not configured.");
  }

  return hash;
}

export function getSafeAdminRedirectPath(nextPath: string | null | undefined) {
  if (!nextPath) {
    return DEFAULT_ADMIN_REDIRECT_PATH;
  }

  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return DEFAULT_ADMIN_REDIRECT_PATH;
  }

  return nextPath;
}
