"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import classNames from "classnames";
import Button from "@atoms/Button";
import startNavigationProgressBar from "@lib/util/startNavigationProgressBar";
import useLanguage from "@lib/useLanguage";
import { LANGUAGES } from "@lib/projectConfig";
import type { TLanguageId } from "@lib/projectConfig";
import style from "./page.module.css";

const LANGUAGE_FLAGS: Record<string, ReactNode> = {
  french: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 900 600"
      className={style.flag}
    >
      <rect width="900" height="600" fill="#CE1126" />
      <rect width="600" height="600" fill="#FFFFFF" />
      <rect width="300" height="600" fill="#002654" />
    </svg>
  ),
  italian: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 3 2"
      className={style.flag}
    >
      <rect width="1" height="2" fill="#009246" />
      <rect width="1" height="2" x="1" fill="#fff" />
      <rect width="1" height="2" x="2" fill="#ce2b37" />
    </svg>
  ),
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
    <main className={style.container}>
      <section className={style.hero}>
        <h1 className={style.title}>
          Learn a new language,
          <br />
          just <span className={style.titleItalic}>one sentence</span> at a
          time.
        </h1>

        <p className={style.subtitle}>
          LanguageLicks is a learning tool inspired by music. We'll help you
          build a repertoire of sentences, just like guitar players learn licks,
          so that you can unlock your ability to jam freely in conversations. It
          takes muscle memory to improvise.
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
                {LANGUAGE_FLAGS[lang.id]}
              </span>
              <span className={style.languageLabel}>{lang.label}</span>
            </button>
          ))}
        </div>

        <div className={style.ctaButton}>
          <Button
            theme="primary"
            onClick={() => {
              startNavigationProgressBar();
              router.push("/lessons");
            }}
          >
            Start learning {LANGUAGES.find((l) => l.id === language)?.label}
          </Button>
        </div>

        <span className={style.free}>10 free lessons, no account required</span>
      </section>

      <section className={style.more}>
        <p className={style.subtitle}>
          A four-step active recall and space repetition system.
        </p>

        <div className={style.steps}>
          {FEATURES.map((f) => {
            const [num, ...rest] = f.title.split(". ");
            const label = rest.join(". ");

            return (
              <div key={f.title} className={style.step}>
                <span className={style.stepNumber}>{num}</span>
                <span className={style.stepLabel}>{label}</span>
              </div>
            );
          })}
        </div>

        <div className={style.moreButton}>
          <Button
            theme="secondary"
            onClick={() => {
              startNavigationProgressBar();
              router.push("/about");
            }}
          >
            Find out more
          </Button>
        </div>
      </section>
    </main>
  );
}
