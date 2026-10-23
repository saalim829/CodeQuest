
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

const AUTH_STORAGE_KEY = "codequest_auth";

function readStoredAuth() {
  try {
    const stored = sessionStorage.getItem(AUTH_STORAGE_KEY);

    if (!stored) {
      return { user: null, token: null };
    }

    const parsed = JSON.parse(stored);

    if (
      !parsed ||
      typeof parsed.token !== "string" ||
      !parsed.token ||
      !parsed.user ||
      typeof parsed.user !== "object"
    ) {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
      return { user: null, token: null };
    }

    return {
      user: parsed.user,
      token: parsed.token,
    };
  } catch {
    return { user: null, token: null };
  }
}

function storeAuth(user, token) {
  try {
    sessionStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({ user, token })
    );
  } catch (error) {
    console.error("Could not save the login session:", error);
  }
}

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
  const [initialAuth] = useState(readStoredAuth);
  const [user, setUser] = useState(initialAuth.user);
  const [token, setToken] = useState(initialAuth.token);

  const login = useCallback(async (email, password) => {
    const data = await authRequest("login", { email, password });

    setUser(data.user);
    setToken(data.token);
    storeAuth(data.user, data.token);

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
    storeAuth(data.user, data.token);

    return data.user;
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((currentUser) => {
      if (!currentUser) return currentUser;

      const updatedUser = { ...currentUser, ...updates };

      try {
        const stored = sessionStorage.getItem(AUTH_STORAGE_KEY);
        const storedAuth = stored ? JSON.parse(stored) : {};

        sessionStorage.setItem(
          AUTH_STORAGE_KEY,
          JSON.stringify({
            ...storedAuth,
            user: updatedUser,
            token: token,
          })
        );
      } catch (error) {
        console.error("Could not update the saved user:", error);
      }

      return updatedUser;
    });
  }, [token]);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);

    try {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (error) {
      console.error("Could not clear the login session:", error);
    }
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
