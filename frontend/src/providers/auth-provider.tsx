"use client";

import { createContext, useContext, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api/client";
import type { Me, Permission } from "@/types/api";

interface AuthContextValue {
  me: Me | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<Me>;
  logout: () => Promise<void>;
  hasPermission: (p: Permission) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();

  const { data: me, isLoading } = useQuery<Me | null>({
    queryKey: ["me"],
    queryFn: async () => {
      try {
        return await api<Me>("/auth/me");
      } catch (e) {
        // 401 simply means "not logged in"
        if (e instanceof ApiError && e.statusCode === 401) return null;
        throw e;
      }
    },
  });

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api<Me>("/auth/login", { method: "POST", body: { email, password } });
      qc.setQueryData(["me"], res);
      return res;
    },
    [qc]
  );

  const logout = useCallback(async () => {
    await api("/auth/logout", { method: "POST" });
    qc.clear();
    window.location.href = "/login";
  }, [qc]);

  const hasPermission = useCallback(
    (p: Permission) => me?.permissions.includes(p) ?? false,
    [me]
  );

  return (
    <AuthContext.Provider value={{ me: me ?? null, isLoading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}