import { Lesson } from "./types";

export const LESSONS: Lesson[] = [
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
  },
];
