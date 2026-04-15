"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import LessonPhase from "./Lesson";
import WritingPractice from "./WritingPractice";
import SpeakingPractice from "./SpeakingPractice";
import Review from "./Review";
import Complete from "./Complete";
import SignUpPrompt from "@atoms/SignUpPrompt";
import useLesson from "@lib/hooks/useLesson";
import useAuth from "@lib/hooks/useAuth";
import useSpeechCredits from "@lib/hooks/useSpeechUsage";
import { TPhase } from "@lib/types";
import useLanguage from "@lib/useLanguage";
import { LANGUAGES } from "@lib/projectConfig";
import useProgress from "@lib/useProgress";
import styles from "./LanguageCard.module.css";

interface Props {
  lessonId: number;
  onBack: () => void;
  mode?: "lesson" | "review";
  isFree?: boolean;
  onNextReview?: () => void;
}

export default function LanguageCard({
  lessonId,
  onBack,
  mode = "lesson",
  isFree = true,
  onNextReview,
}: Props) {
  const { language } = useLanguage();
  const router = useRouter();
  const { isPremium } = useAuth();
  const { getLesson, updatePhase, failReview, updateStreak, updateBestTime } =
    useProgress(language);
  const hasWritingAccess = isFree || isPremium;
  const hasVoiceAccess = isPremium;
  const { data: speechCreditsData } = useSpeechCredits();
  const credits = speechCreditsData?.balance ?? null;
  const { data: lesson, isLoading } = useLesson(lessonId);
  const saved = getLesson(lessonId);
  const savedPhase =
    saved?.phase === "practice" || saved?.phase === "test"
      ? "practice-writing"
      : saved?.phase;

  function getInitialPhase(): TPhase {
    if (mode === "review") return "review";
    if (saved?.completed) return "lesson";
    return savedPhase ?? "lesson";
  }

  const [phase, setPhase] = useState<TPhase>(getInitialPhase);

  const langConfig = LANGUAGES.find((l) => l.id === language);
  const locale = langConfig?.locale ?? "fr-FR";

  function changePhase(next: TPhase, isReview = false) {
    setPhase(next);
    updatePhase(lessonId, next, isReview);
    window.scrollTo(0, 0);
  }

  const handleReviewPass = useCallback(() => {
    changePhase("complete", true);
  }, []);

  const handleReviewFail = useCallback(() => {
    failReview(lessonId);
  }, [lessonId, failReview]);

  const handleViewLesson = useCallback(() => {
    router.push(`/lessons?open=${lessonId}`);
  }, [lessonId, router]);

  const phases: TPhase[] = [
    "lesson",
    "practice-writing",
    "practice-speaking",
    "complete",
  ];

  function handleBack() {
    if (mode === "review") {
      onBack();
      return;
    }
    const currentIndex = phases.indexOf(phase);
    if (currentIndex <= 0) {
      onBack();
      return;
    }
    changePhase(phases[currentIndex - 1]);
  }

  function handleNext() {
    const currentIndex = phases.indexOf(phase);
    if (currentIndex < phases.length - 1) {
      changePhase(phases[currentIndex + 1]);
    }
  }

  if (isLoading || !lesson) {
    return null;
  }

  const isFirstTime = !saved?.completed;
  const isFirstPhase = phase === "lesson";
  const isLastPhase = phases.indexOf(phase) >= phases.length - 1;
  const phaseGated =
    isFirstTime &&
    ((phase === "practice-writing" && (saved?.writingStreak ?? 0) < 3) ||
      (phase === "practice-speaking" && (saved?.speakingStreak ?? 0) < 3));
  const showBack = mode !== "review" && !isFirstPhase && hasWritingAccess;
  const showNext =
    mode !== "review" && !isLastPhase && hasWritingAccess && !phaseGated;

  const phaseLabel =
    phase === "lesson"
      ? "Study"
      : phase === "practice-writing"
        ? "Writing Practice"
        : phase === "practice-speaking"
          ? "Speaking Practice"
          : phase === "review"
            ? "Review"
            : "Complete";

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.header}>
          {showBack && (
            <button className={styles.circleBtn} onClick={handleBack}>
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
          )}
          {!showBack && mode !== "review" && (
            <span className={styles.circlePlaceholder} />
          )}
          {mode === "review" && <span className={styles.circlePlaceholder} />}

          <p className={styles.headerTitle}>{phaseLabel}</p>

          {mode === "review" && (
            <button className={styles.circleBtn} onClick={onBack}>
              <FontAwesomeIcon icon={faXmark} />
            </button>
          )}
          {showNext && (
            <button className={styles.circleBtn} onClick={handleNext}>
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
          )}
          {!showNext && mode !== "review" && (
            <span className={styles.circlePlaceholder} />
          )}
        </div>

        {phase === "lesson" && (
          <LessonPhase
            lesson={lesson}
            onReady={() => {
              if (hasWritingAccess) {
                changePhase("practice-writing");
              }
            }}
          />
        )}

        {phase === "lesson" && !hasWritingAccess && (
          <SignUpPrompt message="Sign up for $10/mo to practice writing, speaking, and unlock reviews." />
        )}

        {phase === "practice-writing" && hasWritingAccess && (
          <WritingPractice
            lesson={lesson}
            languageLabel={langConfig?.label ?? "French"}
            isFirstTime={isFirstTime}
            onReady={() => {
              if (hasVoiceAccess) {
                changePhase("practice-speaking");
              } else {
                changePhase("complete");
              }
            }}
            initialStreak={saved?.writingStreak ?? 0}
            initialBestTime={saved?.writingBestTime ?? null}
            onStreakChange={(streak) =>
              updateStreak(lessonId, "writing", streak)
            }
            onBestTimeChange={(time) =>
              updateBestTime(lessonId, "writing", time)
            }
          />
        )}
        {phase === "practice-speaking" && hasVoiceAccess && (
          <SpeakingPractice
            lesson={lesson}
            locale={locale}
            languageLabel={langConfig?.label ?? "French"}
            credits={credits}
            isFirstTime={isFirstTime}
            onReady={() => {
              if (mode === "lesson" && saved?.completed) {
                onBack();
              } else {
                changePhase("complete");
              }
            }}
            initialStreak={saved?.speakingStreak ?? 0}
            initialBestTime={saved?.speakingBestTime ?? null}
            onStreakChange={(streak) =>
              updateStreak(lessonId, "speaking", streak)
            }
            onBestTimeChange={(time) =>
              updateBestTime(lessonId, "speaking", time)
            }
          />
        )}
        {phase === "review" && hasVoiceAccess && (
          <Review
            lesson={lesson}
            locale={locale}
            languageLabel={langConfig?.label ?? "French"}
            credits={credits}
            onPass={handleReviewPass}
            onFail={handleReviewFail}
            onViewLesson={handleViewLesson}
          />
        )}
        {phase === "complete" && (
          <Complete
            lesson={lesson}
            mode={mode}
            onNext={onBack}
            onPractice={mode === "lesson" ? () => changePhase("lesson") : undefined}
            onNextReview={onNextReview}
            nextReview={saved?.nextReview}
          />
        )}
      </div>
    </div>
  );
}
