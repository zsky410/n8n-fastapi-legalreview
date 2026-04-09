import { createContext, createElement, useContext, useEffect, useState } from "react";

import { DEMO_ACCOUNTS, ROLE_REDIRECTS } from "../lib/constants.js";

const STORAGE_KEY = "legaldesk-ui-auth";
const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStoredUser());
  const isHydrated = true;

  useEffect(() => {
    if (user) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      return;
    }

    window.localStorage.removeItem(STORAGE_KEY);
  }, [isHydrated, user]);

  async function login({ email }) {
    const normalizedEmail = email.trim().toLowerCase();
    const matchedAccount = DEMO_ACCOUNTS.find((account) => account.email === normalizedEmail);

    if (!matchedAccount) {
      throw new Error("Email demo không hợp lệ. Hãy dùng client@demo.vn hoặc admin@demo.vn.");
    }

    const sessionUser = {
      email: matchedAccount.email,
      name: matchedAccount.name,
      company: matchedAccount.company,
      subtitle: matchedAccount.subtitle,
      role: matchedAccount.role,
    };

    setUser(sessionUser);
    return sessionUser;
  }

  function logout() {
    setUser(null);
  }

  const value = {
    user,
    isHydrated,
    login,
    logout,
    getRedirectPathForRole(role) {
      return ROLE_REDIRECTS[role] || "/auth?tab=login";
    },
  };

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth phải được dùng bên trong AuthProvider.");
  }

  return context;
}
