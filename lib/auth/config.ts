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
