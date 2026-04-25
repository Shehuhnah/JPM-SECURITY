import { createContext, useCallback, useContext, useEffect, useState } from "react";

const api = import.meta.env.VITE_API_URL;

const AuthContext = createContext(null);

const normalizeRole = (role) => {
  const value = String(role || "").trim().toLowerCase();

  if (value === "admin") return "Admin";
  if (value === "subadmin" || value === "sub-admin") return "Subadmin";
  if (value === "guard" || value === "security guard") return "Guard";

  return role || null;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshAuth = useCallback(async () => {
    setLoading(true);

    try {
      const res = await fetch(`${api}/api/auth/me`, {
        credentials: "include",
      });

      if (!res.ok) {
        setUser(null);
        return null;
      }

      const data = await res.json();
      const normalizedUser = data
        ? {
            ...data,
            role: normalizeRole(data.role),
          }
        : null;

      setUser(normalizedUser);
      return normalizedUser;
    } catch (error) {
      console.error("Error fetching logged-in user:", error);
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const clearAuth = useCallback(() => {
    setUser(null);
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refreshAuth, clearAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }

  return context;
}

export { normalizeRole };
