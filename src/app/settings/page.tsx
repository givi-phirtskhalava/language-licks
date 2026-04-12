"use client";

import { LANGUAGES, TLanguageId } from "@lib/projectConfig";
import { getLessons } from "@lib/lessons";
import useLanguage from "@lib/useLanguage";
import useProgress from "@lib/useProgress";
import styles from "./Settings.module.css";
import pageStyles from "../page.module.css";

function useReviewStats(language: TLanguageId) {
  const { progress, pausedAt, pauseReviews, unpauseReviews } =
    useProgress(language);
  const lessons = getLessons(language);
  let reviewCount = 0;
  lessons.forEach((_, index) => {
    const p = progress[index];
    if (p && p.completed && !p.retired && p.nextReview) {
      reviewCount++;
    }
  });
  return { reviewCount, pausedAt, pauseReviews, unpauseReviews };
}

export default function SettingsPage() {
  const { language, setLanguage } = useLanguage();

  const stats = LANGUAGES.map(({ id, label }) => ({
    id,
    label,
    ...useReviewStats(id),
  }));

  const languagesWithReviews = stats.filter((s) => s.reviewCount > 0);
  const allPaused =
    languagesWithReviews.length > 0 &&
    languagesWithReviews.every((s) => s.pausedAt);

  function handleToggleAll() {
    if (allPaused) {
      languagesWithReviews.forEach((s) => s.unpauseReviews());
    } else {
      languagesWithReviews
        .filter((s) => !s.pausedAt)
        .forEach((s) => s.pauseReviews());
    }
  }

  return (
    <main className={pageStyles.main}>
      <div className={styles.container}>
        <h2 className={styles.title}>Settings</h2>

        <section className={styles.section}>
          <label className={styles.label} htmlFor="language-select">
            Currently Learning
          </label>
          <select
            id="language-select"
            className={styles.select}
            value={language}
            onChange={(e) => setLanguage(e.target.value as typeof language)}
          >
            {LANGUAGES.map(({ id, label }) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </section>

        <section className={styles.section}>
          {languagesWithReviews.length > 0 && (
            <>
              <div className={styles.sectionHeader}>
                <label className={styles.label}>Pause Reviews</label>
                <button
                  className={styles.toggleAllBtn}
                  onClick={handleToggleAll}
                >
                  {allPaused ? "Unpause All" : "Pause All"}
                </button>
              </div>
              <div className={styles.pauseList}>
                {languagesWithReviews.map((s) => (
                  <div key={s.id} className={styles.pauseRow}>
                    <div className={styles.pauseInfo}>
                      <span className={styles.pauseLabel}>{s.label}</span>
                      <span className={styles.pauseCount}>
                        {s.reviewCount} review{s.reviewCount !== 1 && "s"}
                      </span>
                    </div>
                    <button
                      className={
                        s.pausedAt ? styles.unpauseBtn : styles.pauseBtn
                      }
                      onClick={() =>
                        s.pausedAt ? s.unpauseReviews() : s.pauseReviews()
                      }
                    >
                      {s.pausedAt ? "Unpause" : "Pause"}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {languagesWithReviews.length === 0 && (
            <>
              <label className={styles.label}>Pause Reviews</label>
              <p className={styles.emptyMessage}>
                No upcoming reviews, nothing to pause!
              </p>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
