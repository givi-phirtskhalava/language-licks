import { getPayload } from "payload";
import config from "../../payload.config";

interface ISeedLesson {
  sentence: string;
  translation: string;
  audio: string;
  grammar: { label: string; explanation: string }[];
  liaisonTips?: { phrase: string; explanation: string }[];
  tags: string[];
}

interface ISeedTagGroup {
  name: string;
  tags: string[];
}

type TLanguage = "french" | "italian";

const TAG_GROUPS_BY_LANGUAGE: Record<TLanguage, ISeedTagGroup[]> = {
  french: [
    {
      name: "Tenses & Moods",
      tags: [
        "Present",
        "Passé Composé",
        "Imperfect",
        "Future",
        "Conditional",
        "Subjunctive",
        "Imperative",
        "Continuous",
      ],
    },
    {
      name: "Topics",
      tags: [
        "Animals",
        "Shopping",
        "Health",
        "Family",
        "Technology",
        "Sports",
        "Errands",
        "Time",
        "Work",
        "Feelings",
      ],
    },
    {
      name: "Grammar",
      tags: [
        "Negation",
        "Pronouns",
        "Reflexive",
        "Comparatives",
        "Impersonal",
        "Conjunctions",
        "Idioms",
      ],
    },
  ],
  italian: [
    {
      name: "Tenses & Moods",
      tags: [
        "Present",
        "Passato Prossimo",
        "Imperfect",
        "Future",
        "Conditional",
        "Subjunctive",
        "Imperative",
        "Continuous",
      ],
    },
    {
      name: "Topics",
      tags: [
        "Animals",
        "Shopping",
        "Health",
        "Family",
        "Technology",
        "Sports",
        "Errands",
        "Time",
        "Work",
        "Feelings",
      ],
    },
    {
      name: "Grammar",
      tags: [
        "Negation",
        "Pronouns",
        "Reflexive",
        "Comparatives",
        "Impersonal",
        "Conjunctions",
        "Idioms",
      ],
    },
  ],
};

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
    tags: ["Present", "Animals", "Shopping", "Negation"],
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
    tags: ["Present", "Animals", "Conjunctions", "Impersonal"],
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
    tags: ["Present", "Subjunctive", "Feelings", "Negation", "Conjunctions"],
  },
  {
    sentence:
      "J'ai des courbatures aux abdominaux parce que je suis allée à la salle de sport hier.",
    translation:
      "I'm sore in my abs because I went to the gym yesterday.",
    audio: "/sentence.mp3",
    grammar: [
      {
        label: "J'ai des courbatures",
        explanation:
          '"I have soreness." "Courbatures" (always plural in this sense) means muscle soreness from exertion. "J\'ai" = "je ai" (I have).',
      },
      {
        label: "aux abdominaux",
        explanation:
          '"In the abs." "Aux" is the contraction of "à" + "les" (to/in the), used before a plural noun. "Abdominaux" = abs (masculine plural).',
      },
      {
        label: "parce que",
        explanation: '"Because" — the standard causal conjunction.',
      },
      {
        label: "je suis allée",
        explanation:
          'Passé composé of "aller" (to go). "Aller" takes "être" as auxiliary, so the past participle "allé" agrees with the subject — the extra "e" marks a feminine speaker.',
      },
      {
        label: "à la salle de sport",
        explanation:
          '"To the gym." Literally "to the hall of sport." "Salle" = room/hall, a feminine noun, so "à la."',
      },
      {
        label: "hier",
        explanation: '"Yesterday."',
      },
    ],
    liaisonTips: [
      {
        phrase: "aux‿abdominaux",
        explanation:
          'The "x" in "aux" links to the vowel in "abdominaux" — pronounced "o‿zabdominaux."',
      },
      {
        phrase: "suis‿allée",
        explanation:
          'The "s" in "suis" links to the vowel in "allée" — pronounced "sɥi‿zale."',
      },
    ],
    tags: ["Passé Composé", "Health", "Sports", "Conjunctions"],
  },
  {
    sentence:
      "J'ai expliqué le problème au médecin et il m'a donné une ordonnance pour un anti-douleur.",
    translation:
      "I explained the problem to the doctor and he gave me a prescription for a painkiller.",
    audio: "/sentence.mp3",
    grammar: [
      {
        label: "J'ai expliqué",
        explanation:
          'Passé composé of "expliquer" (to explain), with "avoir" as auxiliary. "J\'ai" = "je ai."',
      },
      {
        label: "au médecin",
        explanation:
          '"To the doctor." "Au" is the contraction of "à" + "le." "Expliquer quelque chose à quelqu\'un" = to explain something to someone.',
      },
      {
        label: "il m'a donné",
        explanation:
          '"He gave me." "M\'" is the elided form of "me" (to me, indirect object pronoun), placed before the auxiliary "a" (avoir). "Donné" is the past participle of "donner" (to give).',
      },
      {
        label: "une ordonnance",
        explanation:
          '"A prescription." Feminine noun — a doctor\'s written prescription for medication.',
      },
      {
        label: "pour un anti-douleur",
        explanation:
          '"For a painkiller." Literally "anti-pain." "Douleur" = pain (feminine), but "anti-douleur" as a compound noun takes masculine "un."',
      },
    ],
    liaisonTips: [
      {
        phrase: "un‿anti-douleur",
        explanation:
          'The "n" in "un" links to the vowel in "anti" — pronounced "œ̃‿nɑ̃ti."',
      },
    ],
    tags: ["Passé Composé", "Health", "Pronouns"],
  },
  {
    sentence:
      "Je cherche une coque pour iPhone 10, si vous en avez encore.",
    translation:
      "I'm looking for a case for iPhone 10, if you still have some.",
    audio: "/sentence.mp3",
    grammar: [
      {
        label: "Je cherche",
        explanation:
          '"I\'m looking for." Present tense of "chercher." Note that "chercher" already includes "for" — no preposition is needed after it.',
      },
      {
        label: "une coque",
        explanation:
          '"A case." "Coque" (feminine) literally means shell/hull; it\'s the standard word for a phone case.',
      },
      {
        label: "pour iPhone 10",
        explanation:
          '"For iPhone 10." "Pour" = for. Numbers after product names are usually read as cardinal numbers — here "dix."',
      },
      {
        label: "si vous en avez encore",
        explanation:
          '"If you still have some." "Si" = if. "En" is a pronoun replacing "de + noun" — here, "some (cases)." "Encore" = still/yet.',
      },
    ],
    liaisonTips: [
      {
        phrase: "vous‿en",
        explanation:
          'The "s" in "vous" links to the vowel in "en" — pronounced "vu‿zɑ̃."',
      },
      {
        phrase: "en‿avez",
        explanation:
          'The "n" in "en" links to the vowel in "avez" — pronounced "ɑ̃‿nave."',
      },
    ],
    tags: ["Present", "Shopping", "Technology", "Pronouns"],
  },
  {
    sentence:
      "Il est déjà quatre heures, il faut que j'aille chercher les enfants à l'école.",
    translation:
      "It's already four o'clock, I need to go pick up the kids from school.",
    audio: "/sentence.mp3",
    grammar: [
      {
        label: "Il est déjà quatre heures",
        explanation:
          '"It\'s already four o\'clock." "Il est" is the impersonal form used for telling time. "Déjà" = already.',
      },
      {
        label: "il faut que",
        explanation:
          '"It is necessary that." Impersonal construction from "falloir" (must). It always triggers the subjunctive in the following clause.',
      },
      {
        label: "j'aille",
        explanation:
          'Present subjunctive of "aller" (to go), 1st person singular — required after "il faut que."',
      },
      {
        label: "chercher les enfants",
        explanation:
          '"Pick up the kids." "Chercher" literally means "to look for," but "aller chercher quelqu\'un" is the standard way to say "to go pick someone up."',
      },
      {
        label: "à l'école",
        explanation:
          '"At/from school." "À" = at/to. "L\'" is the elided definite article before a vowel ("la école" → "l\'école").',
      },
    ],
    liaisonTips: [
      {
        phrase: "les‿enfants",
        explanation:
          'The "s" in "les" links to the vowel in "enfants" — pronounced "le‿zɑ̃fɑ̃."',
      },
    ],
    tags: ["Present", "Subjunctive", "Time", "Family", "Errands", "Impersonal"],
  },
  {
    sentence:
      "Je suis en train de me garer, j'arrive dans cinq minutes.",
    translation:
      "I'm parking right now, I'll be there in five minutes.",
    audio: "/sentence.mp3",
    grammar: [
      {
        label: "Je suis en train de",
        explanation:
          '"I am in the process of." The standard French way to express an action in progress (equivalent to English "-ing" / present continuous). Always followed by an infinitive.',
      },
      {
        label: "me garer",
        explanation:
          'Reflexive infinitive of "se garer" (to park). "Me" is the 1st person reflexive pronoun, placed before the infinitive.',
      },
      {
        label: "j'arrive",
        explanation:
          '"I\'m coming." Present tense of "arriver" used with future meaning — a very common conversational shortcut for imminent arrival.',
      },
      {
        label: "dans cinq minutes",
        explanation:
          '"In five minutes." "Dans" expresses a duration from now until a future point — different from "en," which measures how long something takes.',
      },
    ],
    liaisonTips: [
      {
        phrase: "suis‿en",
        explanation:
          'The "s" in "suis" links to the vowel in "en" — pronounced "sɥi‿zɑ̃."',
      },
    ],
    tags: ["Present", "Continuous", "Time", "Errands", "Reflexive"],
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
    tags: ["Imperative", "Family", "Feelings", "Comparatives", "Negation", "Idioms"],
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
    tags: ["Conditional", "Present", "Work", "Technology", "Pronouns"],
  },
];

async function seedTags(payload: Awaited<ReturnType<typeof getPayload>>) {
  for (const language of Object.keys(TAG_GROUPS_BY_LANGUAGE) as TLanguage[]) {
    const groups = TAG_GROUPS_BY_LANGUAGE[language].map((group) => ({
      name: group.name,
      tags: group.tags.map((name) => ({ name })),
    }));

    const existing = await payload.find({
      collection: "tag-groups",
      where: { language: { equals: language } },
      limit: 1,
    });

    if (existing.docs.length > 0) {
      await payload.update({
        collection: "tag-groups",
        id: existing.docs[0].id,
        data: { language, groups },
      });
    } else {
      await payload.create({
        collection: "tag-groups",
        data: { language, groups },
      });
    }
  }
}

async function seedLessons(payload: Awaited<ReturnType<typeof getPayload>>) {
  const allLessons = [
    ...FRENCH_LESSONS.map((lesson, index) => ({
      language: "french" as const,
      ...lesson,
      order: index + 1,
    })),
    ...ITALIAN_LESSONS.map((lesson, index) => ({
      language: "italian" as const,
      ...lesson,
      order: index + 1,
    })),
  ];

  let updated = 0;
  let inserted = 0;

  for (const lesson of allLessons) {
    const data = {
      language: lesson.language,
      sentence: lesson.sentence,
      translation: lesson.translation,
      audio: lesson.audio,
      grammar: lesson.grammar,
      liaisonTips: lesson.liaisonTips ?? null,
      tags: lesson.tags,
      order: lesson.order,
    };

    const existing = await payload.find({
      collection: "lessons",
      where: {
        and: [
          { language: { equals: lesson.language } },
          { sentence: { equals: lesson.sentence } },
        ],
      },
      limit: 1,
    });

    if (existing.docs.length > 0) {
      await payload.update({
        collection: "lessons",
        id: existing.docs[0].id,
        data,
      });
      updated++;
    } else {
      await payload.create({ collection: "lessons", data });
      inserted++;
    }
  }

  const keepSentences = new Set(allLessons.map((l) => l.sentence));
  const all = await payload.find({
    collection: "lessons",
    limit: 10000,
    pagination: false,
  });

  let removed = 0;
  for (const doc of all.docs) {
    if (!keepSentences.has(doc.sentence)) {
      await payload.delete({ collection: "lessons", id: doc.id });
      removed++;
    }
  }

  return { updated, inserted, removed };
}

async function seed() {
  const payload = await getPayload({ config });

  console.log("Seeding tag groups and tags...");
  await seedTags(payload);

  console.log("Seeding lessons...");
  const { updated, inserted, removed } = await seedLessons(payload);

  console.log(
    `Seed complete: ${updated} updated, ${inserted} inserted, ${removed} removed.`
  );

  process.exit(0);
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
