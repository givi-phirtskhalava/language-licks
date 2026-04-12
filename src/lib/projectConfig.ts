interface ILanguage {
  id: string;
  label: string;
  locale: string;
}

export const LANGUAGES: ILanguage[] = [
  { id: "french", label: "French", locale: "fr-FR" },
  { id: "italian", label: "Italian", locale: "it-IT" },
];

export type TLanguageId = (typeof LANGUAGES)[number]["id"];

export const DEFAULT_LANGUAGE: TLanguageId = "french";

export const FREE_LESSON_COUNT = 10;
