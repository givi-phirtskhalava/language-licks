"use client";

import { useRouter } from "next/navigation";
import classNames from "classnames";
import Button from "@atoms/Button";
import startNavigationProgressBar from "@lib/util/startNavigationProgressBar";
import useLanguage from "@lib/useLanguage";
import { LANGUAGES } from "@lib/projectConfig";
import type { TLanguageId } from "@lib/projectConfig";
import style from "./Landing.module.css";

const LANGUAGE_EMOJIS: Record<string, string> = {
  french: "\uD83C\uDDEB\uD83C\uDDF7",
  italian: "\uD83C\uDDEE\uD83C\uDDF9",
};

const FEATURES = [
  {
    title: "1. Learn",
    description:
      "Each lesson is a natural, native-level sentence with a full breakdown of the required grammar and vocabulary.",
  },
  {
    title: "2. Write",
    description: "Write it from memory with the correct grammar and spelling.",
  },
  {
    title: "3. Speak",
    description:
      "Speak it from memory to reinforce the sentence and practice your pronunciation.",
  },
  {
    title: "4. Review",
    description:
      "We'll prompt you at regular intervals to review each sentence until it becomes instinctive to say.",
  },
];

export default function Landing() {
  const router = useRouter();
  const { language, setLanguage } = useLanguage();

  return (
    <div className={style.container}>
      <section className={style.hero}>
        <h1 className={style.title}>LanguageLicks</h1>

        {/* <p className={style.pitch}>
          A language learning tool inspired by guitar "licks", short phrases
          that musicians practice and use in solos and improvisation.
        </p>

        <p className={style.pitch}>
          Build up a library of phrases through repetition and active recall
          until they become instinctive parts of your language skills, ready to
          be pulled out and used in conversation naturally and effortlessly.
        </p> */}
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

        <span className={style.free}>10 free lessons, no account required</span>

        <div className={style.ctaButton}>
          <Button
            onClick={() => {
              startNavigationProgressBar();
              router.push("/lessons");
            }}
          >
            Start learning {LANGUAGES.find((l) => l.id === language)?.label}
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
