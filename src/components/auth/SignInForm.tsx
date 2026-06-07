"use client";
import Button from "@/components/ui/button/Button";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { showError } from "@/utils/sweetalert";

export default function SignInForm() {
  const [redirectPath, setRedirectPath] = useState("/");
  const { initialized, authenticated, login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      let message = "An error occurred during sign in.";
      let title = "Authentication Error";

      if (error === "OAuthCallback") {
        message = "There was a problem with the authentication callback. This might be due to a configuration issue on the server.";
        title = "Backend Error";
      } else if (error === "AccessDenied") {
        message = "You do not have permission to access this resource.";
        title = "Access Denied";
      } else if (error === "Verification") {
        message = "The verification link has expired or has already been used.";
        title = "Verification Error";
      }

      showError(title, message);
    }
  }, [searchParams]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setRedirectPath(searchParams.get("redirect") || "/");
  }, [searchParams]);

  useEffect(() => {
    if (!initialized || !authenticated) return;
    router.replace(redirectPath);
  }, [initialized, authenticated, router, redirectPath]);

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign In
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Click the button below to sign in with your organization account.
            </p>
          </div>
          <div className="space-y-4">
            <Button
              className="w-full"
              size="sm"
              disabled={!initialized}
              onClick={() => login(redirectPath)}
            >
              Continue to Sign In
            </Button>
          </div>
          {/* <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Don&apos;t have an account?{" "}
              <button
                onClick={() => register()}
                className="font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400"
              >
                Register
              </button>
            </p>
          </div> */}
        </div>
      </div>
    </div>
  );
}
