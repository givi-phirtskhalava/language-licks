"use client";

import { useRouter } from "next/navigation";
import classNames from "classnames";
import Button from "@atoms/Button";
import useAuth from "@lib/hooks/useAuth";
import startNavigationProgressBar from "@lib/util/startNavigationProgressBar";
import useLanguage from "@lib/useLanguage";
import { LANGUAGES, FREE_LESSON_COUNT } from "@lib/projectConfig";
import type { TLanguageId } from "@lib/projectConfig";
import style from "./Landing.module.css";

const LANGUAGE_EMOJIS: Record<string, string> = {
  french: "\uD83C\uDDEB\uD83C\uDDF7",
  italian: "\uD83C\uDDEE\uD83C\uDDF9",
};

const FEATURES = [
  {
    title: "Writing & Speaking Tests",
    description:
      "Type what you hear, then speak it back. Active recall through writing and pronunciation practice.",
  },
  {
    title: "Human Recordings",
    description:
      "Every sentence recorded by native speakers at both natural and slow speeds. No robotic TTS.",
  },
  {
    title: "Learn Words in Context",
    description:
      "Instead of memorizing vocabulary in isolation, learn how words connect inside real sentences — the way native speakers actually use them.",
  },
  {
    title: "Lessons with Explanations",
    description:
      "Grammar breakdowns, liaison rules, and pronunciation tips alongside each sentence.",
  },
  {
    title: "Spaced Repetition",
    description:
      "A review system that schedules sentences at optimal intervals so they stick in long-term memory.",
  },
];

export default function Landing() {
  const router = useRouter();
  const { isPremium } = useAuth();
  const { language, setLanguage } = useLanguage();

  return (
    <div className={style.container}>
      <section className={style.hero}>
        <h1 className={style.title}>Language Licks</h1>

        <blockquote className={style.definition}>
          <div className={style.word}>lick</div>
          <div className={style.pos}>noun</div>
          <p className={style.meaning}>
            A short musical phrase &mdash; a building block that musicians learn
            through repetition until it becomes instinctive, often used in
            solos and improvisation.
          </p>
        </blockquote>

        <p className={style.pitch}>
          Language Licks applies the same idea to language. Master real sentences
          through listening, writing, and speaking &mdash; until they become
          second nature. No multiple choice or passive scrolling &mdash; just
          active recall, the most effective way to build fluency.
        </p>

        <p className={style.tagline}>
          One phrase a day is all it takes.
        </p>
      </section>

      <section className={style.cta}>
        <div className={style.languageCards}>
          {LANGUAGES.map((lang) => (
            <button
              key={lang.id}
              className={classNames(
                style.languageCard,
                language === lang.id && style.languageCardSelected
              )}
              onClick={() => setLanguage(lang.id as TLanguageId)}
            >
              <span className={style.languageEmoji}>
                {LANGUAGE_EMOJIS[lang.id]}
              </span>
              <span className={style.languageLabel}>{lang.label}</span>
            </button>
          ))}
        </div>

        {!isPremium && (
          <span className={style.free}>
            First {FREE_LESSON_COUNT} lessons free, no account required
          </span>
        )}

        <div className={style.ctaButton}>
          <Button
            onClick={() => {
              startNavigationProgressBar();
              router.push("/lessons");
            }}
          >
            Start learning
          </Button>
        </div>
      </section>

      <section className={style.features}>
        {FEATURES.map((f) => (
          <div key={f.title} className={style.feature}>
            <span className={style.featureTitle}>{f.title}</span>
            <span className={style.featureDescription}>{f.description}</span>
          </div>
        ))}
      </section>

      <section className={style.more}>
        <span className={style.moreTitle}>
          Want to know a little more about the process in detail?
        </span>
        <div className={style.moreButton}>
          <Button
            theme="secondary"
            onClick={() => {
              startNavigationProgressBar();
              router.push("/faq");
            }}
          >
            Find out more
          </Button>
        </div>
      </section>
    </div>
  );
}
