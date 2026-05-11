"use client";

import { ArrowRight, Scale } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { API_URL, LoginResponse } from "@/lib/api";

const demoAccounts = [
  { label: "Client", email: "client@example.com" },
  { label: "Reviewer", email: "reviewer@example.com" },
  { label: "Admin", email: "admin@example.com" },
];

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("client@example.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("Invalid email or password");
      }

      const data = (await response.json()) as LoginResponse;
      localStorage.setItem("legalreview_token", data.access_token);
      localStorage.setItem("legalreview_user", JSON.stringify(data.user));

      if (data.user.role === "admin" || data.user.role === "reviewer") {
        router.replace("/admin/queue");
        return;
      }

      router.replace("/documents");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-screen">
      <section className="login-panel" aria-label="LegalReview login">
        <div className="login-brand">
          <div className="brand-mark" aria-hidden="true">
            <Scale size={22} />
          </div>
          <div>
            <p className="eyebrow">LegalReview</p>
            <h1>Review console</h1>
          </div>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <button className="primary-button" type="submit" disabled={isSubmitting}>
            <span>{isSubmitting ? "Signing in" : "Sign in"}</span>
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </form>

        <div className="demo-strip" aria-label="Demo accounts">
          {demoAccounts.map((account) => (
            <button
              key={account.email}
              type="button"
              onClick={() => {
                setEmail(account.email);
                setPassword("password123");
                setError(null);
              }}
            >
              {account.label}
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}

