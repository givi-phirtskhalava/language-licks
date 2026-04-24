"use client";

import toast, { Toaster, ToastBar } from "react-hot-toast";

export default function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        style: {
          background: "#fff",
          color: "var(--text-dark)",
          fontSize: "0.875em",
          borderRadius: "0.5em",
          boxShadow: "0 0.25em 0.75em var(--shadow)",
          cursor: "pointer",
          border: "1px solid var(--border)",
        },
        iconTheme: {
          primary: "var(--accent)",
          secondary: "var(--bg)",
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
