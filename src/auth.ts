import type { NextAuthOptions } from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";

function resolveIssuer() {
  if (process.env.KEYCLOAK_ISSUER) return process.env.KEYCLOAK_ISSUER;

  const baseUrl = process.env.NEXT_PUBLIC_KEYCLOAK_URL;
  const realm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM;
  if (baseUrl && realm) return `${baseUrl}/realms/${realm}`;

  return undefined;
}

const keycloakIssuer = resolveIssuer();

export const authOptions: NextAuthOptions = {
  debug: true, // Enable debug messages in the console
  providers: [
    KeycloakProvider({
      issuer: keycloakIssuer,
      clientId:
        process.env.KEYCLOAK_CLIENT_ID ||
        process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID ||
        "",
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || "",
      // Add this to handle self-signed certificates if necessary
      client: {
        httpOptions: {
          timeout: 10000,
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/signin",
  },
  logger: {
    error(code, metadata) {
      console.error("NextAuth Error:", code, metadata);
    },
    warn(code) {
      console.warn("NextAuth Warning:", code);
    },
    debug(code, metadata) {
      console.log("NextAuth Debug:", code, metadata);
    },
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
        token.idToken = account.id_token;
      }

      const profileRoles =
        ((profile as { realm_access?: { roles?: string[] } } | undefined)?.realm_access
          ?.roles as string[] | undefined) || [];

      token.roles = profileRoles;
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      session.idToken = token.idToken as string | undefined;
      session.issuer = keycloakIssuer;
      session.user.roles = (token.roles as string[] | undefined) || [];
      return session;
    },
  },
};
