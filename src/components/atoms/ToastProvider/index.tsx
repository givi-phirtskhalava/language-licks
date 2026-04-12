"use client";

import toast, { Toaster, ToastBar } from "react-hot-toast";

export default function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        style: {
          background: "var(--bg-white)",
          color: "var(--text-dark)",
          fontSize: "0.875em",
          borderRadius: "0.5em",
          boxShadow: "0 0.25em 0.75em var(--shadow)",
          cursor: "pointer",
        },
        success: {
          style: {
            background: "var(--success-bg)",
            color: "var(--success-dark)",
          },
          iconTheme: {
            primary: "var(--success)",
            secondary: "var(--bg-white)",
          },
        },
        error: {
          style: {
            background: "var(--error-bg)",
            color: "var(--error-dark)",
          },
          iconTheme: {
            primary: "var(--error)",
            secondary: "var(--bg-white)",
          },
        },
      }}
    >
      {(t) => (
        <div onClick={() => toast.dismiss(t.id)}>
          <ToastBar toast={t} />
        </div>
      )}
    </Toaster>
  );
}
