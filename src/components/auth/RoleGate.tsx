"use client";

import { useAuth } from "@/context/AuthContext";

type RoleGateProps = {
  role: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export default function RoleGate({ role, children, fallback = null }: RoleGateProps) {
  const { hasRole } = useAuth();
  if (!hasRole(role)) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}
