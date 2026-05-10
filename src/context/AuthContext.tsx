"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
} from "react";
import { signIn, signOut, useSession } from "next-auth/react";

type AuthContextType = {
  initialized: boolean;
  authenticated: boolean;
  profile: { name?: string | null; email?: string | null; image?: string | null } | null;
  token: string | undefined;
  roles: string[];
  login: (callbackUrl?: string) => Promise<void>;
  logout: () => Promise<void>;
  register: () => Promise<void>;
  hasRole: (role: string) => boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  const initialized = status !== "loading";
  const authenticated = status === "authenticated";
  const profile = useMemo(
    () =>
      authenticated
        ? {
            name: session?.user?.name,
            email: session?.user?.email,
            image: session?.user?.image,
          }
        : null,
    [authenticated, session?.user?.name, session?.user?.email, session?.user?.image]
  );
  const token = session?.accessToken;
  const roles = useMemo(() => session?.user?.roles ?? [], [session?.user?.roles]);

  const login = useCallback(async (callbackUrl?: string) => {
    await signIn("keycloak", {
      callbackUrl: callbackUrl || "/",
    });
  }, []);

  const logout = useCallback(async () => {
    const idToken = session?.idToken;
    const issuer = session?.issuer;

    // First sign out from NextAuth
    await signOut({ redirect: false });

    // Then redirect to Keycloak logout if we have the necessary info
    if (idToken && issuer) {
      const url = `${issuer}/protocol/openid-connect/logout?id_token_hint=${idToken}&post_logout_redirect_uri=${window.location.origin}/signin`;
      window.location.href = url;
    } else {
      // Fallback if session info is missing
      window.location.href = "/signin";
    }
  }, [session]);

  const register = useCallback(async () => {
    await signIn("keycloak", {
      callbackUrl: "/",
    }, { kc_action: "register" } as any);
  }, []);

  const hasRole = useCallback(
    (role: string) => roles.includes(role),
    [roles],
  );

  const value = useMemo(
    () => ({
      initialized,
      authenticated,
      profile,
      token,
      roles,
      login,
      logout,
      register,
      hasRole,
    }),
    [initialized, authenticated, profile, token, roles, login, logout, register, hasRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
