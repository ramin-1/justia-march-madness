import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";
import {
  assertAuthEnvironment,
  getAdminUsername,
  requireConfiguredAdminPasswordHash,
} from "@/lib/auth/config";

const credentialsSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

assertAuthEnvironment();

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Admin Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsedCredentials = credentialsSchema.safeParse(rawCredentials);

        if (!parsedCredentials.success) {
          return null;
        }

        const configuredUsername = getAdminUsername();
        const configuredPasswordHash = requireConfiguredAdminPasswordHash();
        const { username, password } = parsedCredentials.data;

        if (username !== configuredUsername) {
          return null;
        }

        const isValidPassword = await compare(password, configuredPasswordHash);

        if (!isValidPassword) {
          return null;
        }

        return {
          id: "admin",
          name: configuredUsername,
        };
      },
    }),
  ],
});
