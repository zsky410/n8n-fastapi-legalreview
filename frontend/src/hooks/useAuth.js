import { createContext, createElement, useContext, useEffect, useState } from "react";

import { DEMO_ACCOUNTS, ROLE_REDIRECTS } from "../lib/constants.js";
import { getCurrentClientAccount, loginClientAccount, registerClientAccount } from "../lib/api.js";

const STORAGE_KEY = "legaldesk-ui-auth";
const AuthContext = createContext(null);

function readStoredSession() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function buildDemoSession(account) {
  return {
    mode: "demo",
    accessToken: null,
    user: {
      email: account.email,
      name: account.name,
      company: account.company,
      subtitle: account.subtitle,
      role: account.role,
    },
  };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readStoredSession());
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function hydrateSession() {
      const storedSession = readStoredSession();

      if (!storedSession) {
        if (isActive) {
          setSession(null);
          setIsHydrated(true);
        }
        return;
      }

      if (storedSession.mode === "demo") {
        if (isActive) {
          setSession(storedSession);
          setIsHydrated(true);
        }
        return;
      }

      if (storedSession.mode === "api" && storedSession.accessToken) {
        try {
          const user = await getCurrentClientAccount(storedSession.accessToken);
          if (isActive) {
            setSession({
              mode: "api",
              accessToken: storedSession.accessToken,
              user,
            });
          }
        } catch {
          if (isActive) {
            setSession(null);
          }
        } finally {
          if (isActive) {
            setIsHydrated(true);
          }
        }
        return;
      }

      if (isActive) {
        setSession(null);
        setIsHydrated(true);
      }
    }

    hydrateSession();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (session) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      return;
    }

    window.localStorage.removeItem(STORAGE_KEY);
  }, [isHydrated, session]);

  async function login({ email, password }) {
    const normalizedEmail = email.trim().toLowerCase();
    const adminDemoAccount = DEMO_ACCOUNTS.find((account) => account.role === "admin" && account.email === normalizedEmail);

    if (adminDemoAccount) {
      const demoSession = buildDemoSession(adminDemoAccount);
      setSession(demoSession);
      return demoSession.user;
    }

    const authPayload = await loginClientAccount({
      email: normalizedEmail,
      password,
    });

    const nextSession = {
      mode: "api",
      accessToken: authPayload.accessToken,
      user: authPayload.user,
    };
    setSession(nextSession);
    return nextSession.user;
  }

  async function register({ email, password, name, company }) {
    const authPayload = await registerClientAccount({
      email: email.trim().toLowerCase(),
      password,
      name,
      company,
    });

    const nextSession = {
      mode: "api",
      accessToken: authPayload.accessToken,
      user: authPayload.user,
    };
    setSession(nextSession);
    return nextSession.user;
  }

  function logout() {
    setSession(null);
  }

  const value = {
    user: session?.user || null,
    accessToken: session?.accessToken || null,
    sessionMode: session?.mode || null,
    isHydrated,
    login,
    register,
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
