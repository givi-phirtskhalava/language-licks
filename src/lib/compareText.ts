export interface WordComparison {
  expected: string;
  actual: string | null;
  correct: boolean;
}

function normalize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[^\w\sàâäéèêëïîôùûüÿçœæ']/g, "")
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Compute LCS table for two word arrays.
 */
function lcsTable(a: string[], b: string[]): number[][] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  return dp;
}

/**
 * Backtrack LCS to find which expected indices were matched.
 */
function lcsMatches(
  a: string[],
  b: string[],
  dp: number[][]
): Set<number> {
  const matched = new Set<number>();
  let i = a.length;
  let j = b.length;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      matched.add(i - 1);
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }
  return matched;
}

export function compareWords(
  expected: string,
  actual: string
): { words: WordComparison[]; extraWords: string[]; score: number } {
  const expectedWords = normalize(expected);
  const actualWords = normalize(actual);

  const dp = lcsTable(expectedWords, actualWords);
  const matched = lcsMatches(expectedWords, actualWords, dp);

  const words: WordComparison[] = expectedWords.map((exp, i) => ({
    expected: exp,
    actual: matched.has(i) ? exp : null,
    correct: matched.has(i),
  }));

  // Extra words the user said that aren't in the expected sentence
  const matchedActual = new Set<number>();
  let ei = expectedWords.length;
  let ai = actualWords.length;
  while (ei > 0 && ai > 0) {
    if (expectedWords[ei - 1] === actualWords[ai - 1]) {
      matchedActual.add(ai - 1);
      ei--;
      ai--;
    } else if (dp[ei - 1][ai] >= dp[ei][ai - 1]) {
      ei--;
    } else {
      ai--;
    }
  }
  const extraWords = actualWords.filter((_, i) => !matchedActual.has(i));

  const correctCount = matched.size;
  const score =
    expectedWords.length > 0 ? correctCount / expectedWords.length : 0;

  return { words, extraWords, score };
}
