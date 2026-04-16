import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, and, notInArray } from "drizzle-orm";
import * as schema from "./schema";
import { lessons } from "./schema";

interface ISeedLesson {
  sentence: string;
  translation: string;
  audio: string;
  grammar: { label: string; explanation: string }[];
  liaisonTips?: { phrase: string; explanation: string }[];
}

const FRENCH_LESSONS: ISeedLesson[] = [
  {
    sentence: "Nos amis les animaux ne sont pas admis dans ce magasin.",
    translation: "Our animal friends are not allowed in this store.",
    audio: "/sentence.mp3",
    grammar: [
      {
        label: "Nos amis les animaux",
        explanation:
          'Literally "Our friends the animals" — a warm, slightly formal way to refer to pets/animals. "Les animaux" is in apposition to "nos amis."',
      },
      {
        label: "ne … pas",
        explanation:
          'The standard French negation wraps around the verb: "ne sont pas" = "are not."',
      },
      {
        label: "admis",
        explanation:
          'Past participle of "admettre" (to admit/allow), used here as an adjective. Agrees with the masculine plural subject "animaux."',
      },
      {
        label: "dans ce magasin",
        explanation:
          '"In this store." "Dans" = in, "ce" = this (masculine demonstrative adjective), "magasin" = store.',
      },
    ],
    liaisonTips: [
      {
        phrase: "Nos‿amis",
        explanation:
          'The "s" in "nos" links to the vowel in "amis" — pronounced "no‿zami."',
      },
      {
        phrase: "les‿animaux",
        explanation:
          'The "s" in "les" links to the vowel in "animaux" — pronounced "le‿zanimo."',
      },
      {
        phrase: "pas‿admis",
        explanation:
          'The "s" in "pas" links to "admis" — pronounced "pa‿zadmi."',
      },
    ],
  },
  {
    sentence:
      "C'est logique car s'il y a des toiles d'araignée, il doit y avoir des araignées aussi.",
    translation:
      "It's logical because if there are spider webs, there must be spiders too.",
    audio: "/sentence.mp3",
    grammar: [
      {
        label: "C'est logique",
        explanation:
          '"It\'s logical." "C\'est" = "ce est" (it is), "logique" = logical.',
      },
      {
        label: "car",
        explanation:
          '"Because" — a slightly more formal synonym of "parce que," used to introduce a reason.',
      },
      {
        label: "s'il y a",
        explanation:
          '"If there are." "Si" + "il y a" (there is/there are). "Si" contracts to "s\'" before "il."',
      },
      {
        label: "des toiles d'araignée",
        explanation:
          '"Spider webs." Literally "webs of spider." "Toile" = web/cloth, "araignée" = spider. "Des" is the plural indefinite article.',
      },
      {
        label: "il doit y avoir",
        explanation:
          '"There must be." "Devoir" (must/to have to) + "y avoir" (there to be). "Doit" is 3rd person singular present of "devoir."',
      },
      {
        label: "des araignées aussi",
        explanation:
          '"Spiders too." "Aussi" = also/too, placed at the end for emphasis.',
      },
    ],
    liaisonTips: [
      {
        phrase: "s'il‿y a",
        explanation:
          'The "l" in "il" links to the vowel in "y" — pronounced "si‿lya."',
      },
      {
        phrase: "doit‿y avoir",
        explanation:
          'The "t" in "doit" links to the vowel in "y" — pronounced "dwa‿tavoir."',
      },
      {
        phrase: "des‿araignées",
        explanation:
          'The "s" in "des" links to the vowel in "araignées" — pronounced "de‿zaraigne."',
      },
    ],
  },
  {
    sentence:
      "Je pense que c'est difficile, mais je ne pense pas que ce soit impossible.",
    translation: "I think it's difficult, but I don't think it's impossible.",
    audio: "/sentence.mp3",
    grammar: [
      {
        label: "Je pense que",
        explanation:
          '"I think that." When "penser que" is affirmative, it takes the indicative mood — here, "c\'est" (indicative of "être").',
      },
      {
        label: "c'est difficile",
        explanation:
          '"It\'s difficult." "C\'est" = "ce est" (it is), "difficile" = difficult.',
      },
      {
        label: "mais",
        explanation: '"But" — a simple contrastive conjunction.',
      },
      {
        label: "je ne pense pas que",
        explanation:
          'Negative "penser que" expresses doubt, so it triggers the subjunctive in the following clause. Standard negation "ne … pas" wraps around "pense."',
      },
      {
        label: "ce soit impossible",
        explanation:
          '"It is impossible." "Soit" is the present subjunctive of "être," 3rd person singular — required here because of the preceding "je ne pense pas que."',
      },
    ],
    liaisonTips: [
      {
        phrase: "soit‿impossible",
        explanation:
          'The "t" in "soit" links to the vowel in "impossible" — pronounced "swa‿tɛ̃possible."',
      },
    ],
  },
];

const ITALIAN_LESSONS: ISeedLesson[] = [
  {
    sentence: "Non cercare amore più grande di quello della mamma.",
    translation: "Don't look for love greater than that of a mother.",
    audio: "/sentence.mp3",
    grammar: [
      {
        label: "Non cercare",
        explanation:
          '"Don\'t look for." "Non" + infinitive is the informal negative imperative in Italian. "Cercare" = to look for / to search.',
      },
      {
        label: "amore più grande",
        explanation:
          '"Greater love." "Più" = more, used before adjectives to form comparatives. "Grande" = great/big.',
      },
      {
        label: "di quello",
        explanation:
          '"Than that (one)." "Di" = than (in comparisons), "quello" = that one (masculine demonstrative pronoun, referring to "amore" in the abstract sense of love).',
      },
      {
        label: "della mamma",
        explanation:
          '"Of the mother." "Della" = "di" + "la" (of the). "Mamma" = mom/mother — an affectionate, everyday term.',
      },
    ],
  },
  {
    sentence:
      "Potresti rispondere ad Elena sul gruppo per rassicurarla e vedere con loro quando hanno disponibilità?",
    translation:
      "Could you reply to Elena on the group to reassure her and see with them when they are available?",
    audio: "/sentence.mp3",
    grammar: [
      {
        label: "Potresti",
        explanation:
          '"Could you." Conditional present of "potere" (can/to be able to), 2nd person singular. Used for polite requests.',
      },
      {
        label: "rispondere ad Elena",
        explanation:
          '"Reply to Elena." "Rispondere" takes the preposition "a" (to). Before a vowel, "a" becomes "ad" for euphony.',
      },
      {
        label: "sul gruppo",
        explanation:
          '"On the group." "Sul" = "su" + "il" (on the). Refers to a group chat.',
      },
      {
        label: "per rassicurarla",
        explanation:
          '"To reassure her." "Per" + infinitive expresses purpose. The pronoun "-la" (her) is attached to the infinitive.',
      },
      {
        label: "vedere con loro",
        explanation:
          '"See with them." "Loro" = them. "Vedere" here means to check/find out.',
      },
      {
        label: "quando hanno disponibilità",
        explanation:
          '"When they are available." Literally "when they have availability." "Hanno" = 3rd person plural present of "avere" (to have).',
      },
    ],
  },
];

async function seed() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const db = drizzle(pool, { schema });

  console.log("Seeding lessons...");

  const allLessons = [
    ...FRENCH_LESSONS.map((lesson, index) => ({
      language: "french",
      ...lesson,
      order: index + 1,
    })),
    ...ITALIAN_LESSONS.map((lesson, index) => ({
      language: "italian",
      ...lesson,
      order: index + 1,
    })),
  ];

  let updated = 0;
  let inserted = 0;

  for (const lesson of allLessons) {
    const existing = await db
      .select({ id: lessons.id })
      .from(lessons)
      .where(
        and(
          eq(lessons.language, lesson.language),
          eq(lessons.sentence, lesson.sentence)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(lessons)
        .set({
          translation: lesson.translation,
          audio: lesson.audio,
          grammar: lesson.grammar,
          liaisonTips: lesson.liaisonTips ?? null,
          order: lesson.order,
        })
        .where(eq(lessons.id, existing[0].id));
      updated++;
    } else {
      await db.insert(lessons).values({
        language: lesson.language,
        sentence: lesson.sentence,
        translation: lesson.translation,
        audio: lesson.audio,
        grammar: lesson.grammar,
        liaisonTips: lesson.liaisonTips ?? null,
        order: lesson.order,
      });
      inserted++;
    }
  }

  const keepIds = (
    await db
      .select({ id: lessons.id })
      .from(lessons)
      .where(
        notInArray(
          lessons.sentence,
          allLessons.map((l) => l.sentence)
        )
      )
  ).map((r) => r.id);

  let removed = 0;
  if (keepIds.length > 0) {
    for (const id of keepIds) {
      await db.delete(schema.progress).where(eq(schema.progress.lessonId, id));
      await db.delete(lessons).where(eq(lessons.id, id));
      removed++;
    }
  }

  console.log(
    `Seed complete: ${updated} updated, ${inserted} inserted, ${removed} removed.`
  );

  await pool.end();
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
