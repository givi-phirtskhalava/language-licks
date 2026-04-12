import { ILesson } from "./types";

export const LESSONS: ILesson[] = [
  {
    sentence: "Nos amis les animaux ne sont pas admis dans ce magasin.",
    translation: "Our animal friends are not allowed in this store.",
    audio: "/sentence.mp3",
    grammar: [
      {
        label: "Nos amis les animaux",
        explanation:
          'Literally "Our friends the animals" \u2014 a warm, slightly formal way to refer to pets/animals. "Les animaux" is in apposition to "nos amis."',
      },
      {
        label: "ne \u2026 pas",
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
