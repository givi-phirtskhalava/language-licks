export type TCefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export const CEFR_LEVELS: TCefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export interface ILessonListItem {
  id: number;
  sentence: string;
  translation: string;
  tags: string[];
  isFree: boolean;
  cefr: TCefrLevel;
}

export interface ILesson {
  id: number;
  sentence: string;
  translation: string;
  context?: string;
  audio: string;
  grammar: { label: string; explanation: string }[];
  liaisonTips?: { phrase: string; explanation: string }[];
  tags: string[];
  isFree: boolean;
}

export type TPhase = "lesson" | "practice" | "practice-writing" | "practice-speaking" | "test" | "review" | "complete";

export interface ILessonProgress {
  phase: TPhase;
  completed: boolean;
  completedAt: number | null;
  firstCompletedAt: number | null;
  interval: number;
  nextReview: string | null;
  retired: boolean;
  speakingUnlocked: boolean;
  lessonLearned: boolean;
  reviewPassCount: number;
  reviewFailCount: number;
  consecutiveFails: number;
}

export type TDailyLog = Record<string, { l: number; r: number }>;
