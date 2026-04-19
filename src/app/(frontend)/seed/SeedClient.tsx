"use client";

import { useState } from "react";
import style from "./Seed.module.css";
import pageStyles from "../page.module.css";

interface ISeedResult {
  updated: number;
  inserted: number;
  removed: number;
}

export default function SeedClient() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ISeedResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSeed() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Seed failed");
      } else {
        setResult({
          updated: data.updated,
          inserted: data.inserted,
          removed: data.removed,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Seed failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={pageStyles.main}>
      <div className={style.container}>
        <h2 className={style.title}>Seed Database</h2>
        <p className={style.description}>
          Upserts tag groups and lessons for all languages. Lessons not in the
          seed file will be removed.
        </p>
        <button
          className={style.button}
          onClick={handleSeed}
          disabled={loading}
        >
          {loading ? "Seeding..." : "Run Seed"}
        </button>

        {result && (
          <div className={style.result}>
            <div>Inserted: {result.inserted}</div>
            <div>Updated: {result.updated}</div>
            <div>Removed: {result.removed}</div>
          </div>
        )}

        {error && <div className={style.error}>{error}</div>}
      </div>
    </main>
  );
}
