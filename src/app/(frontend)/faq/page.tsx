import styles from "./page.module.css";

export default function FaqPage() {
  return (
    <main className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>FAQ</h1>
        <div className={styles.list}>
          <div className={styles.item}>
            <h2 className={styles.question}>
              What&apos;s different about LanguageLicks?
            </h2>
            <p className={styles.answer}>
              It focuses on active recall &mdash; the hardest but most effective
              part of language learning. There&apos;s no multiple choice or
              passive scrolling. You're asked to write and speak the sentences
              you're learning with regular reviews at increasing intervals.
            </p>
          </div>

          <div className={styles.item}>
            <h2 className={styles.question}>
              What&apos;s the goal of memorizing every sentence?
            </h2>
            <p className={styles.answer}>
              If you practice and repeat a sentence enough times, it becomes
              second nature. You will no longer translate in your head, and
              you'll start expressing yourself in ways that a native speaker
              would. You also won't second guess yourself when speaking that
              sentence.
            </p>
          </div>

          <div className={styles.item}>
            <h2 className={styles.question}>
              Is this method guaranteed to work?
            </h2>
            <p className={styles.answer}>
              It may not be for everyone — different people learn in different
              ways, and you should supplement your learning. But every sentence
              you learn and actively recall means you're building up your
              language skills. As long as you keep learning new sentences and
              reviewing them so you don't forget, you're getting closer to
              fluency. The spaced repetition system is based on scientific
              research, and you can{" "}
              <a
                href="https://en.wikipedia.org/wiki/Spaced_repetition"
                target="_blank"
                rel="noopener noreferrer"
              >
                read more about it here
              </a>
            </p>
          </div>

          <div className={styles.item}>
            <h2 className={styles.question}>
              Do you teach grammar and vocabulary?
            </h2>
            <p className={styles.answer}>
              Yes, we break down the grammar and vocabulary that's relevant for
              the lesson. The lessons are designed to introduce you to different
              tenses, conjugation, and vocabulary over time, focusing only on
              the relevant grammar and vocab for each sentence to make it easier
              to absorb, one step at a time.
            </p>
          </div>

          <div className={styles.item}>
            <h2 className={styles.question}>
              How many lessons should I do per day?
            </h2>
            <p className={styles.answer}>
              We recommend 1 or 2 new lessons per day. At that pace, your daily
              reviews queue will never grow too large. If you have more time,
              you can do more, but make sure you can keep up with reviews every
              day. It's recommended to do fewer new lessons and stay on top of
              your reviews than to rush ahead and let them pile up.
            </p>
          </div>

          <div className={styles.item}>
            <h2 className={styles.question}>
              Can I learn multiple languages with one account?
            </h2>
            <p className={styles.answer}>
              Yes. You can change your language at any time from the home page
              or settings. Your progress is saved separately for each language,
              so you can switch back and forth without losing anything. Make
              sure to pause your reviews in one language before switching to
              another if you think they're going to pile up.
            </p>
          </div>

          <div className={styles.item}>
            <h2 className={styles.question}>
              How accurate is your audio recognition system for speaking
              practice?
            </h2>
            <p className={styles.answer}>
              We're using a machine learning model, and it won't always be
              perfect. On top of that, we've also intentionally set the pass
              threshold low enough that people with different accents, speech
              impediments, and levels of confidence can take part. If you've
              passed the writing test, chances are you know the sentence well
              enough. The goal is to do a cursory check on your speaking and
              provide another opportunity to reinforce what you already know.
            </p>
          </div>

          <div className={styles.item}>
            <h2 className={styles.question}>
              Should I still use other resources?
            </h2>
            <p className={styles.answer}>
              Absolutely, immerse yourself in the language with movies, music,
              books, and conversations. LanguageLicks is designed to complement
              your learning by providing a way to practice active recall.
            </p>
          </div>

          <div className={styles.item}>
            <h2 className={styles.question}>What about privacy and cookies?</h2>
            <p className={styles.answer}>
              We only store what&apos;s necessary to run the app &mdash; your
              email, progress, subscription status, and anonymous analytics data
              to see how users interact with the site. We don&apos;t do any
              invasive marketing tracking, we don&apos;t sell your data, and we
              don&apos;t use cookies beyond what&apos;s needed for
              authentication. Your voice recordings are processed in real time
              on our own speech recognition servers and are never stored or used
              to train any AI model.
            </p>
          </div>

          <div className={styles.item}>
            <h2 className={styles.question}>Who built this website?</h2>
            <p className={styles.answer}>
              This website was built by Givi, a guitar player and web developer
              from Georgia with over ten years of experience in web development.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
