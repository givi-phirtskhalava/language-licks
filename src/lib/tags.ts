export type TTagGroupId = "tenses" | "topics" | "grammar";

interface ITagGroup {
  id: TTagGroupId;
  label: string;
  tags: string[];
}

export const TAG_GROUPS: ITagGroup[] = [
  {
    id: "tenses",
    label: "Tenses & Moods",
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
    id: "topics",
    label: "Topics",
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
    id: "grammar",
    label: "Grammar",
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
];

export const ALL_TAGS: string[] = TAG_GROUPS.flatMap((group) => group.tags);
