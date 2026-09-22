import { createContext, useContext, useEffect, useState } from "react";
import { api, clearToken, setToken } from "./api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem("inno.token")));

  useEffect(() => {
    if (!localStorage.getItem("inno.token")) return;
    api.me().then(setUser).catch(() => clearToken()).finally(() => setLoading(false));
  }, []);

  async function authenticate(method, body) {
    const result = await api[method](body);
    setToken(result.access_token);
    setUser(await api.me());
  }

  const value = {
    user,
    loading,
    login: (body) => authenticate("login", body),
    register: (body) => authenticate("register", body),
    logout: () => { clearToken(); setUser(null); },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);