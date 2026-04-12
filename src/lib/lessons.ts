import { TLanguageId } from "./projectConfig";

interface ILegacyLesson {
  sentence: string;
  translation: string;
  audio: string;
  grammar: { label: string; explanation: string }[];
  liaisonTips: { phrase: string; explanation: string }[];
}

const FRENCH_LESSONS: ILegacyLesson[] = [
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
];

const ITALIAN_LESSONS: ILegacyLesson[] = [
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
    liaisonTips: [],
  },
];

const LESSONS_BY_LANGUAGE: Record<TLanguageId, ILegacyLesson[]> = {
  french: FRENCH_LESSONS,
  italian: ITALIAN_LESSONS,
};

export function getLessons(language: TLanguageId): ILegacyLesson[] {
  return LESSONS_BY_LANGUAGE[language];
}
