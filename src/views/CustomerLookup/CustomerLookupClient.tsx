"use client";

import { useState } from "react";
import { Button } from "@payloadcms/ui";

import style from "./CustomerLookup.module.css";

interface ICustomer {
  id: number;
  email: string;
  name: string | null;
  language: string;
  createdAt: number;
  lastLoginAt: number | null;
  paddleCustomerId: string | null;
  paddleSubscriptionId: string | null;
  subscriptionStatus: string | null;
  subscriptionPlanEnd: number | null;
  giftedExpiresAt: number | null;
  giftedLifetime: boolean;
  giftedAt: number | null;
  giftedNote: string | null;
  isPremium: boolean;
}

function formatDate(ts: number | null): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleString();
}

function formatDateOnly(ts: number | null): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString();
}

function describeGift(user: ICustomer): string {
  if (user.giftedLifetime) return "Lifetime";
  if (user.giftedExpiresAt && user.giftedExpiresAt > Date.now()) {
    return `Until ${formatDateOnly(user.giftedExpiresAt)}`;
  }
  if (user.giftedExpiresAt) {
    return `Expired ${formatDateOnly(user.giftedExpiresAt)}`;
  }
  return "None";
}

export default function CustomerLookupClient() {
  const [email, setEmail] = useState("");
  const [user, setUser] = useState<ICustomer | null>(null);
  const [lookupError, setLookupError] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);

  const [months, setMonths] = useState("1");
  const [note, setNote] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setLookupError("");
    setActionError("");
    setUser(null);
    setLookupLoading(true);

    try {
      const res = await fetch("/api/admin/gift/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLookupError(data.error || "Lookup failed");
        return;
      }

      setUser(data.user);
    } catch {
      setLookupError("Something went wrong");
    } finally {
      setLookupLoading(false);
    }
  }

  async function refreshUser(userId: number) {
    const res = await fetch("/api/admin/gift/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email: user?.email ?? "" }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.user?.id === userId) setUser(data.user);
    }
  }

  async function handleGrantMonths() {
    if (!user) return;

    const parsed = Number.parseInt(months, 10);
    if (!Number.isInteger(parsed) || parsed < 1) {
      setActionError("Enter a positive number of months");
      return;
    }

    setActionError("");
    setActionLoading(true);

    try {
      const res = await fetch("/api/admin/gift/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userId: user.id,
          months: parsed,
          note: note.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setActionError(data.error || "Grant failed");
        return;
      }

      await refreshUser(user.id);
    } catch {
      setActionError("Something went wrong");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleGrantLifetime() {
    if (!user) return;

    setActionError("");
    setActionLoading(true);

    try {
      const res = await fetch("/api/admin/gift/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userId: user.id,
          lifetime: true,
          note: note.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setActionError(data.error || "Grant failed");
        return;
      }

      await refreshUser(user.id);
    } catch {
      setActionError("Something went wrong");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRevoke() {
    if (!user) return;
    if (!confirm("Revoke this user's gifted subscription?")) return;

    setActionError("");
    setActionLoading(true);

    try {
      const res = await fetch("/api/admin/gift/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        setActionError(data.error || "Revoke failed");
        return;
      }

      await refreshUser(user.id);
    } catch {
      setActionError("Something went wrong");
    } finally {
      setActionLoading(false);
    }
  }

  const hasGift =
    !!user && (user.giftedLifetime || (user.giftedExpiresAt !== null));

  return (
    <div className={style.content}>
      <form onSubmit={handleLookup} className={style.lookupForm}>
        <input
          type="email"
          className={style.input}
          placeholder="customer@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />
        <Button type="submit" buttonStyle="primary" disabled={lookupLoading}>
          {lookupLoading ? "Looking up…" : "Look up"}
        </Button>
      </form>

      {lookupError && <p className={style.error}>{lookupError}</p>}

      {user && (
        <div className={style.panels}>
          <section className={style.panel}>
            <h2 className={style.panelTitle}>Customer</h2>
            <dl className={style.detailList}>
              <dt>Email</dt>
              <dd>{user.email}</dd>

              <dt>Name</dt>
              <dd>{user.name || "—"}</dd>

              <dt>Language</dt>
              <dd>{user.language}</dd>

              <dt>Created</dt>
              <dd>{formatDate(user.createdAt)}</dd>

              <dt>Last login</dt>
              <dd>{formatDate(user.lastLoginAt)}</dd>

              <dt>Premium</dt>
              <dd>
                <span
                  className={
                    user.isPremium ? style.badgeOn : style.badgeOff
                  }
                >
                  {user.isPremium ? "Active" : "Inactive"}
                </span>
              </dd>
            </dl>
          </section>

          <section className={style.panel}>
            <h2 className={style.panelTitle}>Paddle subscription</h2>
            <dl className={style.detailList}>
              <dt>Status</dt>
              <dd>{user.subscriptionStatus || "None"}</dd>

              <dt>Plan ends</dt>
              <dd>{formatDateOnly(user.subscriptionPlanEnd)}</dd>

              <dt>Customer ID</dt>
              <dd className={style.mono}>{user.paddleCustomerId || "—"}</dd>

              <dt>Subscription ID</dt>
              <dd className={style.mono}>{user.paddleSubscriptionId || "—"}</dd>
            </dl>
          </section>

          <section className={style.panel}>
            <h2 className={style.panelTitle}>Gift status</h2>
            <dl className={style.detailList}>
              <dt>Current</dt>
              <dd>{describeGift(user)}</dd>

              <dt>Granted</dt>
              <dd>{formatDate(user.giftedAt)}</dd>

              <dt>Note</dt>
              <dd>{user.giftedNote || "—"}</dd>
            </dl>
          </section>

          <section className={style.panel}>
            <h2 className={style.panelTitle}>Grant gift</h2>

            {user.subscriptionStatus === "active" && (
              <p className={style.warning}>
                This user has an active paid Paddle subscription that renews{" "}
                {formatDateOnly(user.subscriptionPlanEnd)}. A gift will overlap
                with their paid coverage — let them know they can cancel
                without losing access. Their subscription will stay active
                through the current period and stop auto-renewing.
              </p>
            )}

            <p className={style.helper}>
              Granting months stacks onto an existing future expiry. Lifetime
              overrides any expiry.
            </p>

            <label className={style.label}>Note (optional)</label>
            <input
              type="text"
              className={style.input}
              placeholder="e.g. support comp, contest winner"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
            />

            <div className={style.grantRow}>
              <input
                type="number"
                className={style.monthsInput}
                min={1}
                max={1200}
                value={months}
                onChange={(e) => setMonths(e.target.value)}
              />
              <Button
                buttonStyle="primary"
                onClick={handleGrantMonths}
                disabled={actionLoading}
              >
                Grant months
              </Button>
              <Button
                buttonStyle="secondary"
                onClick={handleGrantLifetime}
                disabled={actionLoading}
              >
                Grant lifetime
              </Button>
            </div>

            {hasGift && (
              <div className={style.revokeRow}>
                <Button
                  buttonStyle="secondary"
                  onClick={handleRevoke}
                  disabled={actionLoading}
                >
                  Revoke gift
                </Button>
              </div>
            )}

            {actionError && <p className={style.error}>{actionError}</p>}
          </section>
        </div>
      )}
    </div>
  );
}
