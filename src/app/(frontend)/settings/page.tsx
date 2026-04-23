"use client";

import { useState } from "react";
import { LANGUAGES, TLanguageId } from "@lib/projectConfig";
import useLessons from "@lib/hooks/useLessons";
import useLanguage from "@lib/useLanguage";
import useProgress, { clearAllProgress } from "@lib/useProgress";
import Modal from "@/components/atoms/Modal";
import Button from "@atoms/Button";
import styles from "./Settings.module.css";
import pageStyles from "../page.module.css";

function useReviewStats(language: TLanguageId) {
  const { progress, pausedAt, pauseReviews, unpauseReviews } =
    useProgress(language);
  const { data: lessons } = useLessons(language);
  let reviewCount = 0;
  lessons?.forEach((lesson) => {
    const p = progress[lesson.id];
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

  const [showClearModal, setShowClearModal] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);
  const [clearError, setClearError] = useState("");

  const currentLanguage = LANGUAGES.find((l) => l.id === language);
  const currentLabel = currentLanguage?.label ?? language;

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

  function closeClearModal() {
    setShowClearModal(false);
    setClearError("");
    setClearLoading(false);
  }

  async function handleClearProgress() {
    setClearError("");
    setClearLoading(true);
    try {
      await clearAllProgress(language);
      closeClearModal();
    } catch {
      setClearError("Something went wrong");
    } finally {
      setClearLoading(false);
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

        <section className={styles.group}>
          <p className={styles.dangerTitle}>Danger zone</p>
          <div className={styles.dangerSection}>
            <p className={styles.dangerDescription}>
              Clear all your {currentLabel} lesson progress and review
              schedules. Other languages are not affected.
            </p>
            <Button theme="secondary" onClick={() => setShowClearModal(true)}>
              Clear {currentLabel} progress
            </Button>
          </div>
        </section>
      </div>

      {showClearModal && (
        <Modal onClose={closeClearModal}>
          <p className={styles.modalTitle}>Clear {currentLabel} progress</p>
          <div className={styles.modalForm}>
            <p className={styles.modalText}>
              This will permanently erase all your <strong>{currentLabel}</strong>{" "}
              lesson progress and review schedules. Progress for other
              languages will not be affected. This cannot be undone.
            </p>
            {clearError && <p className={styles.modalError}>{clearError}</p>}
            <div className={styles.modalActions}>
              <Button theme="secondary" onClick={closeClearModal}>
                Cancel
              </Button>
              <Button
                theme="danger"
                loading={clearLoading}
                onClick={handleClearProgress}
              >
                Clear {currentLabel} progress
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </main>
  );
}
