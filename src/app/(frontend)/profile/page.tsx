"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import useAuth from "@lib/hooks/useAuth";
import { clearDbMode } from "@lib/useProgress";
import Modal from "@/components/atoms/Modal";
import Button from "@atoms/Button";
import GoPremium from "@atoms/GoPremium";
import styles from "./Profile.module.css";
import pageStyles from "../page.module.css";

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

type TModal = null | "change-email" | "delete-account";
type TEmailStep = "email" | "code";
type TDeleteStep = "send" | "confirm";

export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isLoggedIn, isPremium, isLoading } = useAuth();

  const [modal, setModal] = useState<TModal>(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingError, setBillingError] = useState("");

  // Change email state
  const [emailStep, setEmailStep] = useState<TEmailStep>("email");
  const [newEmail, setNewEmail] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  // Delete account state
  const [deleteStep, setDeleteStep] = useState<TDeleteStep>("send");
  const [deleteCode, setDeleteCode] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  function resetEmailState() {
    setEmailStep("email");
    setNewEmail("");
    setEmailCode("");
    setEmailError("");
    setEmailLoading(false);
  }

  function resetDeleteState() {
    setDeleteStep("send");
    setDeleteCode("");
    setDeleteConfirmation("");
    setDeleteError("");
    setDeleteLoading(false);
  }

  function closeModal() {
    setModal(null);
    resetEmailState();
    resetDeleteState();
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    clearDbMode();
    queryClient.setQueryData(["auth", "me"], null);
    router.push("/");
  }

  async function handleSendEmailCode(e: React.FormEvent) {
    e.preventDefault();
    setEmailError("");
    setEmailLoading(true);

    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail }),
      });

      if (!res.ok) {
        const data = await res.json();
        setEmailError(data.error || "Failed to send code");
        return;
      }

      setEmailStep("code");
    } catch {
      setEmailError("Something went wrong");
    } finally {
      setEmailLoading(false);
    }
  }

  async function handleChangeEmail(e: React.FormEvent) {
    e.preventDefault();
    setEmailError("");
    setEmailLoading(true);

    try {
      const res = await fetch("/api/auth/change-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail, code: emailCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setEmailError(data.error || "Failed to change email");
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      closeModal();
    } catch {
      setEmailError("Something went wrong");
    } finally {
      setEmailLoading(false);
    }
  }

  async function handleSendDeleteCode() {
    if (!user) return;
    setDeleteError("");
    setDeleteLoading(true);

    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });

      if (!res.ok) {
        const data = await res.json();
        setDeleteError(data.error || "Failed to send code");
        return;
      }

      setDeleteStep("confirm");
    } catch {
      setDeleteError("Something went wrong");
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleDeleteAccount(e: React.FormEvent) {
    e.preventDefault();
    setDeleteError("");
    setDeleteLoading(true);

    try {
      const res = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: deleteCode,
          confirmation: deleteConfirmation,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setDeleteError(data.error || "Failed to delete account");
        return;
      }

      clearDbMode();
      queryClient.setQueryData(["auth", "me"], null);
      router.push("/");
    } catch {
      setDeleteError("Something went wrong");
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleCancelSubscription() {
    setBillingError("");
    setBillingLoading(true);
    try {
      const res = await fetch("/api/billing/cancel", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        setBillingError(data.error || "Failed to cancel subscription");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    } catch {
      setBillingError("Something went wrong");
    } finally {
      setBillingLoading(false);
    }
  }

  async function handleResumeSubscription() {
    setBillingError("");
    setBillingLoading(true);
    try {
      const res = await fetch("/api/billing/resume", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        setBillingError(data.error || "Failed to resume subscription");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    } catch {
      setBillingError("Something went wrong");
    } finally {
      setBillingLoading(false);
    }
  }

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push("/login");
    }
  }, [isLoading, isLoggedIn, router]);

  if (isLoading || !isLoggedIn) {
    return null;
  }

  const isCanceled = user?.subscriptionStatus === "canceled";
  const isPastDue = user?.subscriptionStatus === "past_due";
  const isActive = user?.subscriptionStatus === "active";
  const inGracePeriod =
    isCanceled &&
    !!user?.subscriptionPlanEnd &&
    user.subscriptionPlanEnd > Date.now();

  return (
    <main className={pageStyles.main}>
      <div className={styles.container}>
        <div className={styles.profileHeader}>
          <div className={styles.avatar}>
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <div className={styles.profileInfo}>
            <p className={styles.email}>{user?.email}</p>
            {isPremium && <span className={styles.badge}>Paid Member</span>}
            {!isPremium && <p className={styles.plan}>Free Account</p>}
          </div>
        </div>

        <section className={styles.group}>
          <p className={styles.sectionTitle}>Billing</p>

          {isActive && (
            <div className={styles.section}>
              {user?.subscriptionPlanEnd && (
                <p className={styles.billingDetail}>
                  Current period ends {formatDate(user.subscriptionPlanEnd)}.
                  You will be billed a few days before renewal.
                </p>
              )}
              {billingError && (
                <p className={styles.billingError}>{billingError}</p>
              )}
              <Button
                theme="secondary"
                loading={billingLoading}
                onClick={handleCancelSubscription}
              >
                Cancel subscription
              </Button>
            </div>
          )}

          {inGracePeriod && (
            <div className={styles.section}>
              <div className={styles.statusRow}>
                <span className={styles.canceledNote}>Canceling</span>
              </div>
              <p className={styles.billingDetail}>
                Your subscription was canceled, but you can still use premium
                features until {formatDate(user.subscriptionPlanEnd!)}.
              </p>
              {billingError && (
                <p className={styles.billingError}>{billingError}</p>
              )}
              <Button
                loading={billingLoading}
                onClick={handleResumeSubscription}
              >
                Resume subscription
              </Button>
            </div>
          )}

          {isPastDue && (
            <div className={styles.section}>
              <p className={styles.billingWarning}>
                Your payment was declined. Paddle will retry automatically, but
                your premium access is suspended until the payment succeeds.
              </p>
              {billingError && (
                <p className={styles.billingError}>{billingError}</p>
              )}
            </div>
          )}

          {!isPremium && !isPastDue && !inGracePeriod && <GoPremium />}
        </section>

        <section className={styles.group}>
          <p className={styles.sectionTitle}>Account</p>
          <div className={styles.section}>
            {user?.name && (
              <div>
                <p className={styles.label}>Name</p>
                <p className={styles.value}>{user.name}</p>
              </div>
            )}
            <Button theme="primary" onClick={() => setModal("change-email")}>
              Change email
            </Button>
            <Button theme="secondary" onClick={handleLogout}>
              Log out
            </Button>
          </div>
        </section>

        <section className={styles.group}>
          <p className={styles.dangerTitle}>Danger zone</p>
          <div className={styles.dangerSection}>
            <Button
              theme="secondary"
              onClick={() => setModal("delete-account")}
            >
              Delete account
            </Button>
          </div>
        </section>
      </div>

      {modal === "change-email" && (
        <Modal onClose={closeModal}>
          <p className={styles.modalTitle}>Change email</p>

          {emailStep === "email" && (
            <form onSubmit={handleSendEmailCode} className={styles.modalForm}>
              <p className={styles.modalText}>
                Enter your new email address. We'll send a verification code to
                confirm you own it.
              </p>
              <label htmlFor="new-email" className={styles.modalLabel}>
                New email
              </label>
              <input
                id="new-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="new@example.com"
                className={styles.modalInput}
                required
                autoFocus
              />
              {emailError && <p className={styles.modalError}>{emailError}</p>}
              <div className={styles.modalActions}>
                <Button theme="secondary" onClick={closeModal}>
                  Cancel
                </Button>
                <Button type="submit" loading={emailLoading}>
                  Send code
                </Button>
              </div>
            </form>
          )}

          {emailStep === "code" && (
            <form onSubmit={handleChangeEmail} className={styles.modalForm}>
              <p className={styles.modalText}>
                Enter the 6-digit code sent to <strong>{newEmail}</strong>
              </p>
              <label htmlFor="email-code" className={styles.modalLabel}>
                Verification code
              </label>
              <input
                id="email-code"
                type="text"
                inputMode="numeric"
                value={emailCode}
                onChange={(e) => setEmailCode(e.target.value)}
                placeholder="000000"
                className={styles.modalInput}
                maxLength={6}
                required
                autoFocus
              />
              {emailError && <p className={styles.modalError}>{emailError}</p>}
              <div className={styles.modalActions}>
                <Button theme="secondary" onClick={closeModal}>
                  Cancel
                </Button>
                <Button type="submit" loading={emailLoading}>
                  Confirm
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}

      {modal === "delete-account" && (
        <Modal onClose={closeModal}>
          <p className={styles.modalTitle}>Delete account</p>

          {deleteStep === "send" && (
            <div className={styles.modalForm}>
              <p className={styles.modalText}>
                This will permanently delete your account and all progress. A
                verification code will be sent to <strong>{user?.email}</strong>{" "}
                to confirm.
              </p>
              {deleteError && (
                <p className={styles.modalError}>{deleteError}</p>
              )}
              <div className={styles.modalActions}>
                <Button theme="secondary" onClick={closeModal}>
                  Cancel
                </Button>
                <Button
                  theme="danger"
                  loading={deleteLoading}
                  onClick={handleSendDeleteCode}
                >
                  Send code
                </Button>
              </div>
            </div>
          )}

          {deleteStep === "confirm" && (
            <form onSubmit={handleDeleteAccount} className={styles.modalForm}>
              <p className={styles.modalText}>
                Enter the code sent to <strong>{user?.email}</strong> and type{" "}
                <strong>delete</strong> to confirm.
              </p>
              <label htmlFor="delete-code" className={styles.modalLabel}>
                Verification code
              </label>
              <input
                id="delete-code"
                type="text"
                inputMode="numeric"
                value={deleteCode}
                onChange={(e) => setDeleteCode(e.target.value)}
                placeholder="000000"
                className={styles.modalInput}
                maxLength={6}
                required
                autoFocus
              />
              <label htmlFor="delete-confirm" className={styles.modalLabel}>
                Type "delete" to confirm
              </label>
              <input
                id="delete-confirm"
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="delete"
                className={styles.modalInput}
                required
              />
              {deleteError && (
                <p className={styles.modalError}>{deleteError}</p>
              )}
              <div className={styles.modalActions}>
                <Button theme="secondary" onClick={closeModal}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  theme="danger"
                  loading={deleteLoading}
                  disabled={deleteConfirmation.toLowerCase() !== "delete"}
                >
                  Delete account
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </main>
  );
}
