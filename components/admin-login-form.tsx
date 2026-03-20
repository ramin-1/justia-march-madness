"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";

export function AdminLoginForm({
  defaultUsername,
  callbackUrl,
}: {
  defaultUsername: string;
  callbackUrl: string;
}) {
  const [username, setUsername] = useState(defaultUsername);
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const result = await signIn("credentials", {
      username,
      password,
      callbackUrl,
      redirect: false,
    });

    setIsSubmitting(false);

    if (!result || result.error) {
      setErrorMessage("Invalid username or password.");
      return;
    }

    window.location.assign(result.url ?? callbackUrl);
  }

  return (
    <form
      className="max-w-md space-y-4 rounded-xl border bg-white p-4 shadow-sm sm:p-6"
      onSubmit={onSubmit}
    >
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="admin-username">
          Username
        </label>
        <input
          id="admin-username"
          className="w-full rounded-md border border-slate-300 px-3 py-2"
          type="text"
          autoComplete="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="admin-password">
          Password
        </label>
        <input
          id="admin-password"
          className="w-full rounded-md border border-slate-300 px-3 py-2"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>

      {errorMessage ? (
        <p className="text-sm text-red-700" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <button
        type="submit"
        className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-70 sm:w-auto"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
