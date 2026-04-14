import styles from "./page.module.css";

export default function FaqPage() {
  return (
    <main className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>FAQ</h1>
        <div className={styles.list}>
          <div className={styles.item}>
            <h2 className={styles.question}>Who is this for?</h2>
            <p className={styles.answer}>
              Anyone who wants to learn a language, at any level. Whether
              you&apos;re a complete beginner or looking to sharpen what you
              already know, the lessons are designed to help you make meaningful
              progress through focused, hands-on practice.
            </p>
          </div>

          <div className={styles.item}>
            <h2 className={styles.question}>
              What&apos;s different about Language Licks?
            </h2>
            <p className={styles.answer}>
              It focuses on active recall &mdash; the hardest but most effective
              part of language learning. You can&apos;t pass a review unless you
              get it right. There&apos;s no multiple choice or passive
              scrolling. You have to write and speak the sentence from memory,
              which is what actually builds fluency.
            </p>
          </div>

          <div className={styles.item}>
            <h2 className={styles.question}>
              Do I have to memorize everything?
            </h2>
            <p className={styles.answer}>
              Yes, but the first step is to understand every part of what
              you&apos;re going to memorize. Spend a few minutes &mdash; or
              longer &mdash; studying the lesson, its grammar notes, and
              pronunciation tips. Then use the practice mode to repeat the
              sentence until you can recall it from memory. The more you
              practice, the easier it becomes to internalize the grammar and
              vocabulary naturally.
            </p>
          </div>
          <div className={styles.item}>
            <h2 className={styles.question}>
              Is this method guaranteed to work?
            </h2>
            <p className={styles.answer}>
              It's not for everyone — different people learn in different ways,
              and you should supplement your learning. But every sentence you
              memorize and actively recall means you're one sentence and a few
              vocabulary words ahead. As long as you keep learning new sentences
              and reviewing them so you don't forget, you're getting closer to
              fluency.
            </p>
          </div>

          <div className={styles.item}>
            <h2 className={styles.question}>
              Do you teach grammar and vocabulary?
            </h2>
            <p className={styles.answer}>
              We don&apos;t teach grammar or vocabulary in isolation. Instead,
              you learn how words connect inside real sentences &mdash; the way
              native speakers actually use them. Every lesson includes a
              breakdown of the sentence &mdash; grammar rules, word meanings,
              and pronunciation notes &mdash; so you understand what you&apos;re
              memorizing, not just how to repeat it.
            </p>
          </div>

          <div className={styles.item}>
            <h2 className={styles.question}>
              Should I still use other resources?
            </h2>
            <p className={styles.answer}>
              Absolutely. Immerse yourself in the language with movies, music,
              books, and conversations. Language Licks is designed to complement
              your learning by providing focused practice on real sentences, but
              exposure to the language in various contexts is essential for
              fluency.
            </p>
          </div>

          <div className={styles.item}>
            <h2 className={styles.question}>
              What&apos;s the goal of memorizing every sentence?
            </h2>
            <p className={styles.answer}>
              The goal is to say the sentence until it becomes instinctive
              &mdash; so you can use it without thinking. Once a phrase is
              second nature, you can pull parts of it into other contexts, remix
              it with different words, and adapt it on the fly. Speaking is
              natural and we don&apos;t usually think before we speak (although
              it would be nice if people did that more often) &mdash; and
              that&apos;s exactly what we want to achieve with a new language
              too.
            </p>
          </div>

          <div className={styles.item}>
            <h2 className={styles.question}>
              How many lessons should I do per day?
            </h2>
            <p className={styles.answer}>
              We recommend 1 or 2 new lessons per day. At that pace, your daily
              reviews will never grow past 8&ndash;16 &mdash; very manageable.
              If you have more time, you can do more, but make sure you can keep
              up with reviews every day. Reviews are where the real learning
              happens, so it&apos;s better to do fewer new lessons and stay on
              top of your reviews than to rush ahead and let them pile up.
            </p>
          </div>

          <div className={styles.item}>
            <h2 className={styles.question}>
              How does the lesson format work?
            </h2>
            <p className={styles.answer}>
              Each lesson centers on a real sentence. You listen to native
              recordings at natural and slow speeds, then practice by writing
              and speaking the sentence back. Grammar tips and pronunciation
              notes are provided alongside each sentence to help you understand
              what you&apos;re learning.
            </p>
          </div>

          <div className={styles.item}>
            <h2 className={styles.question}>Is Language Licks free?</h2>
            <p className={styles.answer}>
              The first 10 lessons in each language are completely free and
              don&apos;t require an account. After that, a premium subscription
              unlocks the full library of lessons and all future content.
              Speaking practice and tests are exclusive to premium users because
              they require additional processing power for speech recognition.
            </p>
          </div>

          <div className={styles.item}>
            <h2 className={styles.question}>How much does premium cost?</h2>
            <p className={styles.answer}>
              Premium is $10 a month. All payments are handled by Paddle, a
              secure third-party payment provider. We never see or store your
              card details.
            </p>
          </div>

          <div className={styles.item}>
            <h2 className={styles.question}>What about privacy and cookies?</h2>
            <p className={styles.answer}>
              We only store what&apos;s necessary to run the app &mdash; your
              email, progress, and subscription status. We don&apos;t do any
              invasive marketing tracking, we don&apos;t sell your data, and we
              don&apos;t use cookies beyond what&apos;s needed for
              authentication. Your voice recordings are processed in real time
              by Microsoft Azure Speech Services and are never stored &mdash;
              not by us, and not by Microsoft. We don&apos;t use your audio for
              training AI or any other purpose. Microsoft&apos;s own{" "}
              <a
                href="https://learn.microsoft.com/en-us/azure/foundry/responsible-ai/speech-service/speech-to-text/data-privacy-security"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                privacy policy
              </a>{" "}
              applies to speech processing and may change over time, but we will
              make reasonable efforts to ensure your data is not misused by any
              third party.
            </p>
          </div>

          <div className={styles.item}>
            <h2 className={styles.question}>Can I switch languages?</h2>
            <p className={styles.answer}>
              Yes. You can change your language at any time from the home page
              or settings. Your progress is saved separately for each language,
              so you can switch back and forth without losing anything.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
