
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

const AuthContext = createContext(null);

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

async function authRequest(endpoint, credentials) {
  const response = await fetch(`${API_BASE_URL}/auth/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Authentication failed");
  }

  return data;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const login = useCallback(async (email, password) => {
    const data = await authRequest("login", { email, password });

    setUser(data.user);
    setToken(data.token);

    return data.user;
  }, []);

  const register = useCallback(async (username, email, password) => {
    const data = await authRequest("register", {
      username,
      email,
      password,
    });

    setUser(data.user);
    setToken(data.token);

    return data.user;
  }, []);

  // Merge updated stats without removing username or other user fields.
  const updateUser = useCallback((updates) => {
    setUser((currentUser) =>
      currentUser ? { ...currentUser, ...updates } : currentUser
    );
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      login,
      register,
      updateUser,
      logout,
    }),
    [user, token, login, register, updateUser, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
