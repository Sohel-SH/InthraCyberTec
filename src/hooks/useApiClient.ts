import { useAuth } from "@/context/AuthContext";
import { getSession, signIn } from "next-auth/react";
import { useCallback } from "react";
import { showError, showWarning, showSessionExpiredConfirm } from "@/utils/sweetalert";

export function useApiClient() {
  const { token, tokenExpiresAt, logout } = useAuth();

  const handleSessionExpired = useCallback(async () => {
    const shouldLogInAgain = await showSessionExpiredConfirm();
    if (shouldLogInAgain) {
      // Re-authenticate and return to the current page
      await signIn("keycloak", { callbackUrl: window.location.href });
    } else {
      // Go to the sign-in page
      await logout();
    }
  }, [logout]);

  const fetchWithAuth = useCallback(
    async (url: string, options: RequestInit = {}) => {
      let currentToken = token;

      // Check if token is expired or about to expire (within 30 seconds)
      if (tokenExpiresAt && Date.now() + 30000 > tokenExpiresAt) {
        console.log("Token is about to expire, refreshing...");
        const session = await getSession();
        if (session?.accessToken) {
          currentToken = session.accessToken;
        } else {
          console.warn("Failed to refresh token. Prompting for session renewal...");
          await handleSessionExpired();
          throw new Error("Session expired");
        }
      }

      const headers = new Headers(options.headers);

      if (currentToken) {
        headers.set("Authorization", `Bearer ${currentToken}`);
      }

      try {
        const response = await fetch(url, {
          ...options,
          headers,
        });

        if (response.status === 401) {
          // Token might be expired or session is invalid
          console.warn("Unauthorized request detected (401). Prompting for session renewal...");
          await handleSessionExpired();
        } else if (!response.ok) {
          // Handle other backend errors
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.error || errorData.message || response.statusText || "An unexpected error occurred on the server.";
          
          showError("Backend Error", errorMessage);
        }

        return response;
      } catch (error: any) {
        // If it's the "Session expired" error we threw above, just re-throw it
        if (error.message === "Session expired") throw error;

        // Handle frontend/network errors
        showError("Connection Error", error.message || "Failed to connect to the server. Please check your internet connection.");
        throw error;
      }
    },
    [token, tokenExpiresAt, handleSessionExpired]
  );

  return { fetchWithAuth };
}
