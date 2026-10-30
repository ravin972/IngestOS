"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

export interface UserSession {
  email: string;
}

interface AuthContextType {
  user: UserSession | null;
  isLoading: boolean;
  setSession: (email: string, token?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  setSession: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Read session on mount
    try {
      const stored = localStorage.getItem("ingestos_user");
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        // Fallback check from cookie
        const match = document.cookie.match(/(?:^|; )ingestos_user=([^;]*)/);
        if (match) {
          setUser({ email: decodeURIComponent(match[1]) });
        }
      }
    } catch (e) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }

    // Cross-tab and local event synchronization
    const handleAuthChange = () => {
      try {
        const stored = localStorage.getItem("ingestos_user");
        if (stored) {
          setUser(JSON.parse(stored));
        } else {
          const match = document.cookie.match(/(?:^|; )ingestos_user=([^;]*)/);
          setUser(match ? { email: decodeURIComponent(match[1]) } : null);
        }
      } catch {
        setUser(null);
      }
    };

    window.addEventListener("storage", handleAuthChange);
    window.addEventListener("ingestos_auth_updated", handleAuthChange);
    return () => {
      window.removeEventListener("storage", handleAuthChange);
      window.removeEventListener("ingestos_auth_updated", handleAuthChange);
    };
  }, []);

  const setSession = (email: string, token?: string) => {
    const sessionObj: UserSession = { email };
    setUser(sessionObj);
    try {
      localStorage.setItem("ingestos_user", JSON.stringify(sessionObj));
      if (token) {
        localStorage.setItem("ingestos_token", token);
      }
      document.cookie = `ingestos_user=${encodeURIComponent(email)}; path=/; max-age=604800; SameSite=Lax`;
      window.dispatchEvent(new Event("ingestos_auth_updated"));
    } catch (e) {
      console.warn("Unable to persist session:", e);
    }
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem("ingestos_user");
      localStorage.removeItem("ingestos_token");
      document.cookie = "ingestos_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      window.dispatchEvent(new Event("ingestos_auth_updated"));
    } catch (e) {
      console.warn("Unable to clear session:", e);
    }
    window.location.href = "/auth";
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, setSession, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
