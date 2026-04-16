export interface ILessonListItem {
  id: number;
  sentence: string;
  translation: string;
}

export interface ILesson {
  id: number;
  sentence: string;
  translation: string;
  audio: string;
  grammar: { label: string; explanation: string }[];
  liaisonTips?: { phrase: string; explanation: string }[];
}

export type TPhase = "lesson" | "practice" | "practice-writing" | "practice-speaking" | "test" | "review" | "complete";

export interface IAzureWordScore {
  word: string;
  accuracyScore: number;
  errorType: "None" | "Omission" | "Insertion" | "Mispronunciation";
}

export interface IAzureSpeechResult {
  transcript: string;
  accuracyScore: number;
  fluencyScore: number;
  completenessScore: number;
  prosodyScore: number;
  words: IAzureWordScore[];
}

export interface ISpeechCredits {
  balance: number;
  dailyAllowance: number;
  maxAccumulation: number;
}

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
