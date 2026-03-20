export type ContentType =
  | "question"
  | "flashcard"
  | "exam"
  | "voice"
  | "coding";

export interface QualityIssue {
  layer: "structural" | "content" | "uniqueness" | "actionability";
  severity: "critical" | "warning" | "info";
  field?: string;
  message: string;
}

export interface QualityScore {
  overall: number;
  structural: number;
  content: number;
  uniqueness: number;
  actionability: number;
  issues: QualityIssue[];
  suggestions: string[];
}

interface TextMetrics {
  wordCount: number;
  sentenceCount: number;
  avgWordLength: number;
  hasCode: boolean;
  codeBlocks: string[];
  bulletPoints: string[];
  questionMarks: number;
}

function analyzeText(text: string): TextMetrics {
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const codeBlocks = text.match(/```[\s\S]*?```/g) || [];
  const bulletPoints = text.match(/[-*•]\s+.+/g) || [];

  return {
    wordCount: words.length,
    sentenceCount: sentences.length,
    avgWordLength:
      words.length > 0
        ? words.reduce((sum, w) => sum + w.length, 0) / words.length
        : 0,
    hasCode: codeBlocks.length > 0,
    codeBlocks,
    bulletPoints,
    questionMarks: (text.match(/\?/g) || []).length,
  };
}

function isCodeComplete(code: string): boolean {
  const openBraces = (code.match(/{/g) || []).length;
  const closeBraces = (code.match(/}/g) || []).length;
  const openParens = (code.match(/\(/g) || []).length;
  const closeParens = (code.match(/\)/g) || []).length;

  return (
    openBraces === closeBraces && openParens === closeParens && openBraces > 0
  );
}

function hasCommonMisconceptions(text: string): boolean {
  const misconceptionIndicators = [
    /\b(many people think|common mistake|often confused|misconception|wrongly|incorrectly|different from)\b/i,
    /\b(not the same as|unlike|versus|vs\.)\b/i,
    /\b(watch out|be careful|avoid|don't|never|always)\b/i,
  ];
  return misconceptionIndicators.some((pattern) => pattern.test(text));
}

function calculateStructuralScore(
  data: Record<string, unknown>,
  type: ContentType,
): { score: number; issues: QualityIssue[] } {
  const issues: QualityIssue[] = [];
  let score = 100;
  const deductions: Array<{
    condition: unknown;
    deduction: number;
    message: string;
    field?: string;
  }> = [];

  switch (type) {
    case "question":
      deductions.push(
        {
          condition: !data.question,
          deduction: 25,
          message: "Missing question text",
          field: "question",
        },
        {
          condition: !data.explanation,
          deduction: 20,
          message: "Missing explanation",
          field: "explanation",
        },
        {
          condition: !data.answer,
          deduction: 25,
          message: "Missing answer",
          field: "answer",
        },
        {
          condition: !data.tags || (data.tags as string[]).length === 0,
          deduction: 10,
          message: "Missing tags",
          field: "tags",
        },
        {
          condition: !data.difficulty,
          deduction: 10,
          message: "Missing difficulty",
          field: "difficulty",
        },
        {
          condition:
            Boolean(data.difficulty) &&
            !["easy", "medium", "hard"].includes(data.difficulty as string),
          deduction: 5,
          message: "Invalid difficulty value",
          field: "difficulty",
        },
      );
      break;

    case "flashcard":
      deductions.push(
        {
          condition: !data.front,
          deduction: 25,
          message: "Missing front (question)",
          field: "front",
        },
        {
          condition: !data.back,
          deduction: 25,
          message: "Missing back (answer)",
          field: "back",
        },
        {
          condition: !data.tags || (data.tags as string[]).length === 0,
          deduction: 15,
          message: "Missing tags",
          field: "tags",
        },
      );
      break;

    case "exam":
      deductions.push(
        {
          condition: !data.question,
          deduction: 20,
          message: "Missing question",
          field: "question",
        },
        {
          condition: !data.options || (data.options as unknown[]).length < 4,
          deduction: 20,
          message: "Missing or insufficient options (need 4)",
          field: "options",
        },
        {
          condition: !data.correctAnswer,
          deduction: 20,
          message: "Missing correct answer",
          field: "correctAnswer",
        },
        {
          condition: !data.explanation,
          deduction: 15,
          message: "Missing explanation",
          field: "explanation",
        },
        {
          condition: !data.tags,
          deduction: 10,
          message: "Missing tags",
          field: "tags",
        },
      );
      break;

    case "coding":
      deductions.push(
        {
          condition: !data.title,
          deduction: 15,
          message: "Missing title",
          field: "title",
        },
        {
          condition: !data.description,
          deduction: 15,
          message: "Missing description",
          field: "description",
        },
        {
          condition: !data.solution,
          deduction: 20,
          message: "Missing solution",
          field: "solution",
        },
        {
          condition:
            !data.testCases || (data.testCases as unknown[]).length === 0,
          deduction: 20,
          message: "Missing test cases",
          field: "testCases",
        },
        {
          condition: !data.constraints,
          deduction: 15,
          message: "Missing constraints",
          field: "constraints",
        },
      );
      break;

    case "voice":
      deductions.push(
        {
          condition: !data.prompt,
          deduction: 30,
          message: "Missing prompt",
          field: "prompt",
        },
        {
          condition: !data.keyPoints || (data.keyPoints as string[]).length < 3,
          deduction: 20,
          message: "Missing or insufficient key points (need 3+)",
          field: "keyPoints",
        },
        {
          condition: !data.tags,
          deduction: 15,
          message: "Missing tags",
          field: "tags",
        },
      );
      break;
  }

  for (const check of deductions) {
    if (check.condition) {
      score -= check.deduction;
      issues.push({
        layer: "structural",
        severity: check.deduction >= 20 ? "critical" : "warning",
        field: check.field,
        message: check.message,
      });
    }
  }

  return { score: Math.max(0, score), issues };
}

function calculateContentScoreQuestion(data: Record<string, unknown>): {
  score: number;
  issues: QualityIssue[];
  suggestions: string[];
} {
  const issues: QualityIssue[] = [];
  const suggestions: string[] = [];
  let score = 100;

  const explanationText = String(data.explanation || "");
  const explanationMetrics = analyzeText(explanationText);

  if (explanationMetrics.wordCount < 50) {
    score -= 20;
    issues.push({
      layer: "content",
      severity: "warning",
      message: "Explanation is too brief (< 50 words)",
    });
    suggestions.push("Add more detailed explanation (at least 50 words)");
  }

  const hasCode =
    explanationMetrics.hasCode || (data.codeExample ? true : false);
  if (!hasCode) {
    score -= 15;
    issues.push({
      layer: "content",
      severity: "warning",
      message: "No code example provided",
    });
    suggestions.push("Add a code example to illustrate the concept");
  } else {
    const codeExample = String(
      data.codeExample || explanationMetrics.codeBlocks[0] || "",
    );
    if (codeExample && !isCodeComplete(codeExample)) {
      score -= 10;
      issues.push({
        layer: "content",
        severity: "info",
        message: "Code example may be incomplete",
      });
    }
  }

  if (
    !hasCommonMisconceptions(explanationText) &&
    explanationMetrics.wordCount > 100
  ) {
    score -= 10;
    suggestions.push("Consider addressing common misconceptions or pitfalls");
  }

  if (data.realWorldContext) {
    score += 5;
  } else {
    suggestions.push(
      "Add real-world context to make the question more practical",
    );
  }

  return { score: Math.min(100, score), issues, suggestions };
}

function calculateContentScoreFlashcard(data: Record<string, unknown>): {
  score: number;
  issues: QualityIssue[];
  suggestions: string[];
} {
  const issues: QualityIssue[] = [];
  const suggestions: string[] = [];
  let score = 100;

  const frontText = String(data.front || "");
  const backText = String(data.back || "");
  const frontMetrics = analyzeText(frontText);
  const backMetrics = analyzeText(backText);

  if (frontMetrics.wordCount < 5) {
    score -= 20;
    issues.push({
      layer: "content",
      severity: "warning",
      message: "Front is too generic or brief",
    });
    suggestions.push("Make the front more specific with context");
  }

  if (frontText.toLowerCase().includes("what is") && frontText.length < 30) {
    score -= 10;
    suggestions.push('Avoid generic "What is X?" format; be more specific');
  }

  if (backMetrics.bulletPoints.length < 2) {
    score -= 15;
    issues.push({
      layer: "content",
      severity: "warning",
      message: "Back lacks bullet points for key information",
    });
    suggestions.push("Add actionable bullet points on the back");
  }

  const hasCode = backMetrics.hasCode;
  if (!hasCode && frontText.toLowerCase().includes("code")) {
    score -= 10;
    suggestions.push("Add code example to demonstrate the concept");
  }

  if (!data.hint) {
    score -= 10;
    suggestions.push("Add a hint to help learners who are stuck");
  } else if (String(data.hint).length > 0) {
    const hintOverlyObvious = new RegExp(backText.substring(0, 20), "i").test(
      String(data.hint),
    );
    if (hintOverlyObvious) {
      score -= 5;
      issues.push({
        layer: "content",
        severity: "info",
        message: "Hint may be too obvious",
      });
    }
  }

  return { score: Math.min(100, score), issues, suggestions };
}

function calculateContentScoreExam(data: Record<string, unknown>): {
  score: number;
  issues: QualityIssue[];
  suggestions: string[];
} {
  const issues: QualityIssue[] = [];
  const suggestions: string[] = [];
  let score = 100;

  const questionText = String(data.question || "");
  const explanationText = String(data.explanation || "");
  const options = (data.options as string[]) || [];

  if (
    questionText.toLowerCase().startsWith("what is") ||
    questionText.toLowerCase().startsWith("define")
  ) {
    score -= 15;
    issues.push({
      layer: "content",
      severity: "warning",
      message: "Question appears definition-based, not scenario-based",
    });
    suggestions.push("Use scenario-based questions instead of definitions");
  }

  if (options.length < 4) {
    score -= 15;
  } else {
    const hasTrivialDistractors =
      options.filter(
        (opt) =>
          opt.length < 10 || opt.toLowerCase().includes("none of the above"),
      ).length > 0;

    if (hasTrivialDistractors) {
      score -= 10;
      suggestions.push("Avoid trivial or placeholder distractors");
    }
  }

  const explanationMetrics = analyzeText(explanationText);
  if (explanationMetrics.wordCount < 30) {
    score -= 15;
    issues.push({
      layer: "content",
      severity: "warning",
      message: "Explanation is too brief",
    });
    suggestions.push("Explain WHY each option is right or wrong");
  }

  const explainsEachOption = options.every((opt) =>
    new RegExp(opt.substring(0, 10), "i").test(explanationText),
  );

  if (!explainsEachOption && explanationMetrics.wordCount > 50) {
    score -= 10;
    suggestions.push(
      "Ensure explanation addresses why each distractor is wrong",
    );
  }

  const testsUnderstanding =
    /(explain|analyze|evaluate|compare|design|how would you)/i.test(
      questionText,
    );
  if (!testsUnderstanding) {
    score -= 10;
    suggestions.push("Focus on testing understanding, not memorization");
  }

  return { score: Math.min(100, score), issues, suggestions };
}

function calculateContentScoreCoding(data: Record<string, unknown>): {
  score: number;
  issues: QualityIssue[];
  suggestions: string[];
} {
  const issues: QualityIssue[] = [];
  const suggestions: string[] = [];
  let score = 100;

  const solutionText = String(data.solution || "");
  const solutionMetrics = analyzeText(solutionText);
  const testCases = (data.testCases as Array<Record<string, unknown>>) || [];

  if (testCases.length < 2) {
    score -= 15;
    issues.push({
      layer: "content",
      severity: "warning",
      message: "Insufficient test cases (need at least 2)",
    });
    suggestions.push("Add more test cases covering edge cases");
  }

  const hasEdgeCases = testCases.some(
    (tc) =>
      JSON.stringify(tc).toLowerCase().includes("edge") ||
      JSON.stringify(tc).toLowerCase().includes("empty") ||
      JSON.stringify(tc).toLowerCase().includes("null") ||
      JSON.stringify(tc).toLowerCase().includes("boundary"),
  );

  if (!hasEdgeCases && testCases.length > 0) {
    suggestions.push("Consider adding edge case test scenarios");
  }

  if (!solutionMetrics.hasCode) {
    score -= 20;
    issues.push({
      layer: "content",
      severity: "critical",
      message: "No code solution provided",
    });
  }

  const hasComments = /\/\//.test(solutionText) || /\/\*/.test(solutionText);
  if (!hasComments) {
    score -= 10;
    suggestions.push("Add comments to explain the solution approach");
  }

  if (data.complexity) {
    const complexity = String(data.complexity).toLowerCase();
    const validComplexity = /(o\(?\d|n!|log|logn|n\^?|2\^?|space)/i.test(
      complexity,
    );
    if (!validComplexity) {
      score -= 10;
      issues.push({
        layer: "content",
        severity: "warning",
        message: "Complexity analysis format unclear",
      });
    }
  } else {
    score -= 10;
    suggestions.push("Add time/space complexity analysis");
  }

  if (data.constraints) {
    const constraintsText = String(data.constraints);
    const hasRealisticConstraints = /\d+/.test(constraintsText);
    if (!hasRealisticConstraints) {
      score -= 5;
      suggestions.push("Make constraints more specific with actual numbers");
    }
  }

  return { score: Math.min(100, score), issues, suggestions };
}

function calculateContentScoreVoice(data: Record<string, unknown>): {
  score: number;
  issues: QualityIssue[];
  suggestions: string[];
} {
  const issues: QualityIssue[] = [];
  const suggestions: string[] = [];
  let score = 100;

  const promptText = String(data.prompt || "");
  const keyPoints = (data.keyPoints as string[]) || [];

  if (promptText.includes("?")) {
    score += 10;
  } else {
    score -= 15;
    issues.push({
      layer: "content",
      severity: "warning",
      message: "Prompt should be in question form",
    });
    suggestions.push("Format prompt as a conversational question");
  }

  if (keyPoints.length < 3) {
    score -= 15;
    issues.push({
      layer: "content",
      severity: "warning",
      message: "Insufficient key points (need at least 3)",
    });
  }

  const genericPoints = keyPoints.filter(
    (p) => p.length < 20 || /^(the|it|this|that)/i.test(p),
  );

  if (genericPoints.length > 0) {
    score -= 10;
    issues.push({
      layer: "content",
      severity: "info",
      message: "Some key points are too generic",
    });
    suggestions.push("Make key points more specific and actionable");
  }

  const hasStructure = data.structure || data.outline || data.format;
  if (!hasStructure) {
    score -= 10;
    suggestions.push("Add structure/outline to guide the response");
  }

  return { score: Math.min(100, score), issues, suggestions };
}

function calculateUniquenessScore(
  data: Record<string, unknown>,
  type: ContentType,
  existingContent: Array<Record<string, unknown>> = [],
): { score: number; issues: QualityIssue[]; suggestions: string[] } {
  const issues: QualityIssue[] = [];
  const suggestions: string[] = [];
  let score = 100;

  if (existingContent.length === 0) {
    return { score: 100, issues, suggestions };
  }

  const currentText = getPrimaryText(data, type).toLowerCase();
  const currentWords = new Set(
    currentText.split(/\s+/).filter((w) => w.length > 3),
  );

  let maxSimilarity = 0;
  let mostSimilar: string | null = null;

  for (const existing of existingContent) {
    if ((existing.content_type as string) !== type) continue;

    const existingText = getPrimaryText(existing, type).toLowerCase();
    const existingWords = new Set(
      existingText.split(/\s+/).filter((w) => w.length > 3),
    );

    const intersection = [...currentWords].filter((w) =>
      existingWords.has(w),
    ).length;
    const union = new Set([...currentWords, ...existingWords]).size;
    const similarity = union > 0 ? intersection / union : 0;

    if (similarity > maxSimilarity) {
      maxSimilarity = similarity;
      mostSimilar = existingText.substring(0, 50);
    }
  }

  if (maxSimilarity > 0.8) {
    score -= 30;
    issues.push({
      layer: "uniqueness",
      severity: "critical",
      message: "High similarity to existing content",
    });
    suggestions.push("Rephrase to distinguish from similar existing content");
  } else if (maxSimilarity > 0.6) {
    score -= 15;
    issues.push({
      layer: "uniqueness",
      severity: "warning",
      message: "Moderate similarity to existing content",
    });
    suggestions.push("Consider adding unique perspectives or examples");
  } else if (maxSimilarity > 0.4) {
    score -= 5;
    suggestions.push("Review similar content to ensure unique value");
  }

  return { score: Math.max(0, score), issues, suggestions };
}

function getPrimaryText(
  data: Record<string, unknown>,
  type: ContentType,
): string {
  switch (type) {
    case "question":
      return String(data.question || data.explanation || "");
    case "flashcard":
      return String(data.front || data.back || "");
    case "exam":
      return String(data.question || data.explanation || "");
    case "coding":
      return String(data.title || data.description || data.solution || "");
    case "voice":
      return String(
        data.prompt || (data.keyPoints as string[])?.join(" ") || "",
      );
    default:
      return JSON.stringify(data);
  }
}

function calculateActionabilityScore(
  data: Record<string, unknown>,
  type: ContentType,
): { score: number; issues: QualityIssue[]; suggestions: string[] } {
  const issues: QualityIssue[] = [];
  const suggestions: string[] = [];
  let score = 100;

  switch (type) {
    case "question":
      const qHasPractical = data.realWorldContext || data.useCase;
      const qHasExamples =
        data.codeExample || /\bexample\b/i.test(String(data.explanation || ""));

      if (!qHasPractical) {
        score -= 15;
        suggestions.push("Add practical use case or real-world context");
      }
      if (!qHasExamples) {
        score -= 10;
        suggestions.push("Include runnable examples");
      }
      break;

    case "flashcard":
      const fHasActionable =
        (data.back as string)?.includes("-") ||
        (data.back as string)?.includes("•");
      if (!fHasActionable) {
        score -= 15;
        suggestions.push("Make back side more actionable with clear steps");
      }
      break;

    case "exam":
      const eIsScenarioBased = !String(data.question || "")
        .toLowerCase()
        .startsWith("what is");
      const eExplainsWrong = String(data.explanation || "").length > 100;

      if (!eIsScenarioBased) {
        score -= 15;
        suggestions.push("Make it scenario-based");
      }
      if (!eExplainsWrong) {
        score -= 10;
        suggestions.push("Explain why distractors are wrong");
      }
      break;

    case "coding":
      const cHasTests = (data.testCases as unknown[])?.length > 0;
      const cHasHints = data.hints || data.solution?.toString().includes("//");

      if (!cHasTests) {
        score -= 20;
        issues.push({
          layer: "actionability",
          severity: "critical",
          message: "No test cases",
        });
      }
      if (!cHasHints) {
        score -= 10;
        suggestions.push("Add hints or step-by-step guidance");
      }
      break;

    case "voice":
      const vHasKeyPoints = (data.keyPoints as string[])?.length >= 3;
      const vHasStructure = data.structure || data.outline;

      if (!vHasKeyPoints) {
        score -= 15;
        suggestions.push("Add more key learning points");
      }
      if (!vHasStructure) {
        score -= 10;
        suggestions.push("Add structure to guide the response");
      }
      break;
  }

  const tags = data.tags as string[];
  if (!tags || tags.length < 2) {
    score -= 10;
    suggestions.push("Add more relevant tags for discoverability");
  }

  return { score: Math.max(0, score), issues, suggestions };
}

export function assessQuality(
  data: Record<string, unknown>,
  type: ContentType,
  existingContent: Array<Record<string, unknown>> = [],
): QualityScore {
  const structuralResult = calculateStructuralScore(data, type);

  let contentResult: ReturnType<typeof calculateContentScoreQuestion>;
  switch (type) {
    case "question":
      contentResult = calculateContentScoreQuestion(data);
      break;
    case "flashcard":
      contentResult = calculateContentScoreFlashcard(data);
      break;
    case "exam":
      contentResult = calculateContentScoreExam(data);
      break;
    case "coding":
      contentResult = calculateContentScoreCoding(data);
      break;
    case "voice":
      contentResult = calculateContentScoreVoice(data);
      break;
  }

  const uniquenessResult = calculateUniquenessScore(
    data,
    type,
    existingContent,
  );
  const actionabilityResult = calculateActionabilityScore(data, type);

  const allIssues = [
    ...structuralResult.issues,
    ...contentResult.issues,
    ...uniquenessResult.issues,
    ...actionabilityResult.issues,
  ];

  const allSuggestions = [
    ...contentResult.suggestions,
    ...uniquenessResult.suggestions,
    ...actionabilityResult.suggestions,
  ];

  const structural = structuralResult.score;
  const content = contentResult.score;
  const uniqueness = uniquenessResult.score;
  const actionability = actionabilityResult.score;

  const overall = Math.round(
    structural * 0.3 + content * 0.4 + uniqueness * 0.2 + actionability * 0.1,
  );

  return {
    overall,
    structural,
    content,
    uniqueness,
    actionability,
    issues: allIssues,
    suggestions: [...new Set(allSuggestions)],
  };
}

export function getQualityGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

export function isPublishable(score: QualityScore): boolean {
  return (
    score.overall >= 70 &&
    !score.issues.some(
      (i) => i.severity === "critical" && i.layer === "structural",
    )
  );
}
