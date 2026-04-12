export interface ILesson {
  sentence: string;
  translation: string;
  audio: string;
  grammar: { label: string; explanation: string }[];
  liaisonTips: { phrase: string; explanation: string }[];
}

export type TPhase = "lesson" | "practice" | "practice-writing" | "practice-speaking" | "test" | "complete";

export interface ILessonProgress {
  phase: TPhase;
  completed: boolean;
  completedAt: number | null;
  interval: number;
  nextReview: number | null;
  retired: boolean;
}
