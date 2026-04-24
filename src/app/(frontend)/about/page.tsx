import styles from "./page.module.css";

const ITEMS = [
  {
    question: "What's different about LanguageLicks?",
    answer: (
      <>
        It focuses on active recall &mdash; the hardest but most effective part
        of language learning. There&apos;s no multiple choice or passive
        scrolling. You're asked to write and speak the sentences you're learning
        with regular reviews at increasing intervals.
      </>
    ),
  },
  {
    question: "What's the goal of memorizing every sentence?",
    answer: (
      <>
        If you practice and repeat a sentence enough times, it becomes second
        nature. You will no longer translate in your head, and you'll start
        expressing yourself in ways that a native speaker would. You also won't
        second guess yourself when speaking that sentence.
      </>
    ),
  },
  {
    question: "Is this method guaranteed to work?",
    answer: (
      <>
        It may not be for everyone — different people learn in different ways,
        and you should supplement your learning. But every sentence you learn
        and actively recall means you're building up your language skills. As
        long as you keep learning new sentences and reviewing them so you don't
        forget, you're getting closer to fluency. The spaced repetition system
        is based on scientific research, and you can{" "}
        <a
          className={styles.link}
          href="https://en.wikipedia.org/wiki/Spaced_repetition"
          target="_blank"
          rel="noopener noreferrer"
        >
          read more about it here
        </a>
      </>
    ),
  },
  {
    question: "Do you teach grammar and vocabulary?",
    answer: (
      <>
        Yes, we break down the grammar and vocabulary that's relevant for the
        lesson. The lessons are designed to introduce you to different tenses,
        conjugation, and vocabulary over time, focusing only on the relevant
        grammar and vocab for each sentence to make it easier to absorb, one
        step at a time.
      </>
    ),
  },
  {
    question: "How many lessons should I do per day?",
    answer: (
      <>
        We recommend 1 or 2 new lessons per day. At that pace, your daily
        reviews queue will never grow too large. If you have more time, you can
        do more, but make sure you can keep up with reviews every day. It's
        recommended to do fewer new lessons and stay on top of your reviews than
        to rush ahead and let them pile up.
      </>
    ),
  },
  {
    question: "Can I learn multiple languages with one account?",
    answer: (
      <>
        Yes. You can change your language at any time from the home page or
        settings. Your progress is saved separately for each language, so you
        can switch back and forth without losing anything. Make sure to pause
        your reviews in one language before switching to another if you think
        they're going to pile up.
      </>
    ),
  },
  {
    question:
      "How accurate is your audio recognition system for speaking practice?",
    answer: (
      <>
        We're using a machine learning model, and it won't always be perfect. On
        top of that, we've also intentionally set the pass threshold low enough
        that people with different accents, speech impediments, and levels of
        confidence can take part. If you've passed the writing test, chances are
        you know the sentence well enough. The goal is to do a cursory check on
        your speaking and provide another opportunity to reinforce what you
        already know.
      </>
    ),
  },
  {
    question: "Should I still use other resources?",
    answer: (
      <>
        Absolutely, immerse yourself in the language with movies, music, books,
        and conversations. LanguageLicks is designed to complement your learning
        by providing a way to practice active recall.
      </>
    ),
  },
  {
    question: "What about privacy and cookies?",
    answer: (
      <>
        We only store what&apos;s necessary to run the app &mdash; your email,
        progress, subscription status, and anonymous analytics data to see how
        users interact with the site. We don&apos;t do any invasive marketing
        tracking, we don&apos;t sell your data, and we don&apos;t use cookies
        beyond what&apos;s needed for authentication. Your voice recordings are
        processed in real time on our own speech recognition servers and are
        never stored or used to train any AI model.
      </>
    ),
  },
  {
    question: "Who built this website?",
    answer: (
      <>
        This website was built by Givi, a guitar player, language enthusiast,
        and developer from Georgia with over ten years of experience in web
        development.
      </>
    ),
  },
];

export default function AboutPage() {
  return (
    <main className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>About</h1>

        <div className={styles.list}>
          {ITEMS.map((item) => (
            <div key={item.question} className={styles.item}>
              <h2 className={styles.question}>{item.question}</h2>
              <p className={styles.answer}>{item.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
