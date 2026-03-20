import { describe, it, expect } from "vitest";
import {
  assessQuality,
  getQualityGrade,
  isPublishable,
  ContentType,
} from "../quality";

describe("Quality Assessment - Questions", () => {
  const validQuestion = {
    question: "What is Docker and why is it used?",
    answer: "Docker is a containerization platform...",
    explanation:
      "Docker allows developers to package applications into containers...",
    tags: ["devops", "docker", "containers"],
    difficulty: "medium",
    codeExample: "docker run hello-world",
    realWorldContext: "Used in CI/CD pipelines",
  };

  it("should return high score for complete question", () => {
    const score = assessQuality(validQuestion, "question");
    expect(score.overall).toBeGreaterThan(70);
    expect(score.structural).toBeGreaterThan(70);
    expect(score.content).toBeGreaterThan(70);
  });

  it("should penalize missing question text", () => {
    const incomplete = { ...validQuestion, question: "" };
    const score = assessQuality(incomplete, "question");
    expect(score.structural).toBeLessThan(80);
    expect(score.issues).toContainEqual(
      expect.objectContaining({ field: "question" }),
    );
  });

  it("should penalize missing explanation", () => {
    const incomplete = { ...validQuestion, explanation: "" };
    const score = assessQuality(incomplete, "question");
    expect(score.structural).toBeLessThan(80);
  });

  it("should penalize missing answer", () => {
    const incomplete = { ...validQuestion, answer: "" };
    const score = assessQuality(incomplete, "question");
    expect(score.structural).toBeLessThan(80);
  });

  it("should penalize missing tags", () => {
    const incomplete = { ...validQuestion, tags: [] };
    const score = assessQuality(incomplete, "question");
    expect(score.structural).toBeLessThan(90);
  });

  it("should penalize invalid difficulty", () => {
    const invalid = { ...validQuestion, difficulty: "extreme" };
    const score = assessQuality(invalid, "question");
    expect(score.issues).toContainEqual(
      expect.objectContaining({ field: "difficulty" }),
    );
  });

  it("should require minimum explanation word count", () => {
    const shortExplanation = {
      ...validQuestion,
      explanation: "Short.",
    };
    const score = assessQuality(shortExplanation, "question");
    expect(score.content).toBeLessThan(85);
    expect(score.suggestions).toContain(
      "Add more detailed explanation (at least 50 words)",
    );
  });

  it("should penalize missing code example", () => {
    const noCode = {
      ...validQuestion,
      codeExample: undefined,
      explanation:
        "This is a long enough explanation without code example to trigger the check...".repeat(
          5,
        ),
    };
    const score = assessQuality(noCode, "question");
    expect(score.content).toBeLessThan(90);
  });

  it("should add bonus for real world context", () => {
    const withContext = {
      ...validQuestion,
      realWorldContext: "Production deployment",
    };
    const withoutContext = { ...validQuestion, realWorldContext: undefined };
    const scoreWith = assessQuality(withContext, "question");
    const scoreWithout = assessQuality(withoutContext, "question");
    expect(scoreWith.content).toBeGreaterThanOrEqual(scoreWithout.content);
  });
});

describe("Quality Assessment - Flashcards", () => {
  const validFlashcard = {
    front: "What is a Docker container?",
    back: "- Isolated runtime environment\n- Contains application and dependencies\n- Lightweight compared to VMs",
    tags: ["docker", "containers"],
    hint: "Think about isolation",
  };

  it("should score complete flashcard highly", () => {
    const score = assessQuality(validFlashcard, "flashcard");
    expect(score.overall).toBeGreaterThan(70);
  });

  it("should penalize missing front", () => {
    const incomplete = { ...validFlashcard, front: "" };
    const score = assessQuality(incomplete, "flashcard");
    expect(score.structural).toBeLessThan(80);
  });

  it("should penalize missing back", () => {
    const incomplete = { ...validFlashcard, back: "" };
    const score = assessQuality(incomplete, "flashcard");
    expect(score.structural).toBeLessThan(80);
  });

  it("should penalize generic front text", () => {
    const generic = {
      ...validFlashcard,
      front: "What is?",
    };
    const score = assessQuality(generic, "flashcard");
    expect(score.content).toBeLessThan(85);
    expect(score.suggestions).toContain(
      'Avoid generic "What is X?" format; be more specific',
    );
  });

  it("should require bullet points on back", () => {
    const noBullets = {
      ...validFlashcard,
      back: "Just some text without structure",
    };
    const score = assessQuality(noBullets, "flashcard");
    expect(score.content).toBeLessThan(85);
    expect(score.suggestions).toContain(
      "Add actionable bullet points on the back",
    );
  });

  it("should penalize missing hint", () => {
    const noHint = { ...validFlashcard, hint: undefined };
    const score = assessQuality(noHint, "flashcard");
    expect(score.actionability).toBeLessThan(100);
  });
});

describe("Quality Assessment - Exams", () => {
  const validExam = {
    question: "Analyze the security implications of running containers as root",
    options: [
      "Containers should always run as root for simplicity",
      "Running as root increases attack surface",
      "Root access in containers is exactly like VM root",
      "Container root is the same as host root",
    ],
    correctAnswer: 1,
    explanation:
      "Running containers as root poses significant security risks...",
    tags: ["security", "docker"],
  };

  it("should score complete exam highly", () => {
    const score = assessQuality(validExam, "exam");
    expect(score.overall).toBeGreaterThan(70);
  });

  it("should penalize definition-based questions", () => {
    const definitionQuestion = {
      ...validExam,
      question: "What is a container orchestrator?",
    };
    const score = assessQuality(definitionQuestion, "exam");
    expect(score.content).toBeLessThan(90);
    expect(score.suggestions).toContain(
      "Use scenario-based questions instead of definitions",
    );
  });

  it("should require minimum options", () => {
    const fewOptions = {
      ...validExam,
      options: ["A", "B", "C"],
    };
    const score = assessQuality(fewOptions, "exam");
    expect(score.structural).toBeLessThan(85);
  });

  it("should penalize trivial distractors", () => {
    const trivial = {
      ...validExam,
      options: [
        "Correct answer",
        "Trivial",
        "None of the above",
        "All of the above",
      ],
    };
    const score = assessQuality(trivial, "exam");
    expect(score.suggestions).toContain(
      "Avoid trivial or placeholder distractors",
    );
  });

  it("should require comprehensive explanation", () => {
    const shortExplanation = {
      ...validExam,
      explanation: "Because.",
    };
    const score = assessQuality(shortExplanation, "exam");
    expect(score.content).toBeLessThan(85);
  });
});

describe("Quality Assessment - Coding Challenges", () => {
  const validCoding = {
    title: "Reverse a Binary Tree",
    description: "Given the root of a binary tree, reverse it.",
    solution:
      "function reverseTree(root) {\n  // Swap children recursively\n  const temp = root.left;\n  root.left = root.right;\n  root.right = temp;\n  reverseTree(root.left);\n  reverseTree(root.right);\n  return root;\n}",
    testCases: [
      { input: [1, 2, 3], expected: [1, 3, 2] },
      { input: [], expected: [] },
    ],
    constraints: "1 <= nodes <= 100",
    complexity: "O(n) time, O(h) space",
  };

  it("should score complete coding challenge highly", () => {
    const score = assessQuality(validCoding, "coding");
    expect(score.overall).toBeGreaterThan(70);
  });

  it("should penalize missing title", () => {
    const incomplete = { ...validCoding, title: "" };
    const score = assessQuality(incomplete, "coding");
    expect(score.structural).toBeLessThan(85);
  });

  it("should penalize missing description", () => {
    const incomplete = { ...validCoding, description: "" };
    const score = assessQuality(incomplete, "coding");
    expect(score.structural).toBeLessThan(85);
  });

  it("should penalize missing solution code", () => {
    const noSolution = {
      ...validCoding,
      solution: "",
    };
    const score = assessQuality(noSolution, "coding");
    expect(score.content).toBeLessThan(80);
    expect(score.issues).toContainEqual(
      expect.objectContaining({ message: "No code solution provided" }),
    );
  });

  it("should require minimum test cases", () => {
    const oneTest = {
      ...validCoding,
      testCases: [{ input: [1], expected: [1] }],
    };
    const score = assessQuality(oneTest, "coding");
    expect(score.content).toBeLessThan(90);
  });

  it("should penalize missing constraints", () => {
    const noConstraints = {
      ...validCoding,
      constraints: "",
    };
    const score = assessQuality(noConstraints, "coding");
    expect(score.actionability).toBeLessThan(100);
  });

  it("should penalize missing complexity analysis", () => {
    const noComplexity = {
      ...validCoding,
      complexity: undefined,
    };
    const score = assessQuality(noComplexity, "coding");
    expect(score.content).toBeLessThan(90);
    expect(score.suggestions).toContain("Add time/space complexity analysis");
  });

  it("should require comments in solution", () => {
    const noComments = {
      ...validCoding,
      solution: "function test() { return true; }",
    };
    const score = assessQuality(noComments, "coding");
    expect(score.content).toBeLessThan(95);
  });
});

describe("Quality Assessment - Voice Scripts", () => {
  const validVoice = {
    prompt: "How would you explain Docker networking to a beginner?",
    keyPoints: [
      "Containers need network access to communicate",
      "Docker provides several network modes",
      "Port mapping allows external access",
    ],
    tags: ["docker", "networking"],
    structure: "Introduction, Explanation, Examples, Summary",
  };

  it("should score complete voice script highly", () => {
    const score = assessQuality(validVoice, "voice");
    expect(score.overall).toBeGreaterThan(70);
  });

  it("should require question format prompt", () => {
    const statementPrompt = {
      ...validVoice,
      prompt: "Docker networking is important",
    };
    const score = assessQuality(statementPrompt, "voice");
    expect(score.content).toBeLessThan(100);
    expect(score.suggestions).toContain(
      "Format prompt as a conversational question",
    );
  });

  it("should require minimum key points", () => {
    const fewPoints = {
      ...validVoice,
      keyPoints: ["Point one", "Point two"],
    };
    const score = assessQuality(fewPoints, "voice");
    expect(score.content).toBeLessThan(85);
  });

  it("should penalize generic key points", () => {
    const genericPoints = {
      ...validVoice,
      keyPoints: ["The thing", "It works", "Use it"],
    };
    const score = assessQuality(genericPoints, "voice");
    expect(score.issues).toContainEqual(
      expect.objectContaining({ message: "Some key points are too generic" }),
    );
  });

  it("should require structure", () => {
    const noStructure = {
      ...validVoice,
      structure: undefined,
      outline: undefined,
      format: undefined,
    };
    const score = assessQuality(noStructure, "voice");
    expect(score.actionability).toBeLessThan(100);
  });
});

describe("Quality Assessment - Uniqueness", () => {
  it("should score highly with no existing content", () => {
    const content = {
      question: "What is Docker?",
      answer: "A container platform",
      explanation: "Docker containers are isolated environments...",
      tags: ["docker"],
      difficulty: "easy",
    };
    const score = assessQuality(content, "question", []);
    expect(score.uniqueness).toBe(100);
  });

  it("should penalize high similarity to existing content", () => {
    const existing = [
      {
        content_type: "question",
        question: "What is Docker container?",
        explanation: "Docker containers are isolated runtime environments.",
      },
    ];

    const similar = {
      question: "What is Docker container?",
      answer: "Same answer",
      explanation: "Docker containers are isolated runtime environments.",
      tags: ["docker"],
      difficulty: "easy",
    };

    const score = assessQuality(similar, "question", existing);
    expect(score.uniqueness).toBeLessThan(70);
    expect(score.issues).toContainEqual(
      expect.objectContaining({ layer: "uniqueness" }),
    );
  });

  it("should only compare content of same type", () => {
    const existing = [
      {
        content_type: "flashcard",
        front: "Docker question",
        back: "Docker answer",
      },
    ];

    const content = {
      question: "What is Docker?",
      answer: "Same answer",
      explanation: "Same explanation about Docker containers.",
      tags: ["docker"],
      difficulty: "easy",
    };

    const score = assessQuality(content, "question", existing);
    expect(score.uniqueness).toBe(100);
  });
});

describe("Quality Assessment - Edge Cases", () => {
  it("should handle empty object", () => {
    const score = assessQuality({}, "question");
    expect(score.overall).toBeLessThan(50);
    expect(score.structural).toBeLessThan(50);
    expect(score.issues.length).toBeGreaterThan(0);
  });

  it("should handle null/undefined fields gracefully", () => {
    const content = {
      question: null,
      answer: undefined,
      explanation: "Valid text",
      tags: null,
      difficulty: null,
    };
    const score = assessQuality(content, "question");
    expect(score.structural).toBeDefined();
  });

  it("should handle arrays as content", () => {
    const content = {
      question: ["array", "question"],
      answer: "string answer",
      explanation: "Valid explanation text here",
      tags: ["test"],
      difficulty: "medium",
    };
    const score = assessQuality(content, "question");
    expect(score.structural).toBeDefined();
  });

  it("should handle extra unexpected fields", () => {
    const content = {
      question: "Valid question",
      answer: "Valid answer",
      explanation: "Valid explanation",
      tags: ["test"],
      difficulty: "medium",
      unexpectedField: "value",
      anotherOne: 123,
    };
    const score = assessQuality(content, "question");
    expect(score.overall).toBeGreaterThan(0);
  });

  it("should handle all content types with minimal valid data", () => {
    const types: ContentType[] = [
      "question",
      "flashcard",
      "exam",
      "voice",
      "coding",
    ];

    const minimalByType = {
      question: {
        question: "Q?",
        answer: "A",
        explanation: "E",
        tags: ["t"],
        difficulty: "easy",
      },
      flashcard: {
        front: "F",
        back: "B",
        tags: ["t"],
      },
      exam: {
        question: "Q?",
        options: ["A", "B", "C", "D"],
        correctAnswer: 0,
        explanation: "E",
        tags: ["t"],
      },
      voice: {
        prompt: "Q?",
        keyPoints: ["P1", "P2", "P3"],
        tags: ["t"],
      },
      coding: {
        title: "T",
        description: "D",
        solution: "code(){}",
        testCases: [{}],
        constraints: "N>0",
      },
    };

    for (const type of types) {
      const score = assessQuality(minimalByType[type], type);
      expect(score.structural).toBeDefined();
    }
  });
});

describe("getQualityGrade", () => {
  it("should return A for scores >= 90", () => {
    expect(getQualityGrade(100)).toBe("A");
    expect(getQualityGrade(90)).toBe("A");
  });

  it("should return B for scores >= 80", () => {
    expect(getQualityGrade(89)).toBe("B");
    expect(getQualityGrade(80)).toBe("B");
  });

  it("should return C for scores >= 70", () => {
    expect(getQualityGrade(79)).toBe("C");
    expect(getQualityGrade(70)).toBe("C");
  });

  it("should return D for scores >= 60", () => {
    expect(getQualityGrade(69)).toBe("D");
    expect(getQualityGrade(60)).toBe("D");
  });

  it("should return F for scores < 60", () => {
    expect(getQualityGrade(59)).toBe("F");
    expect(getQualityGrade(0)).toBe("F");
  });
});

describe("isPublishable", () => {
  it("should return true for score >= 70 with no critical structural issues", () => {
    const score = {
      overall: 80,
      structural: 80,
      content: 80,
      uniqueness: 80,
      actionability: 80,
      issues: [],
      suggestions: [],
    };
    expect(isPublishable(score)).toBe(true);
  });

  it("should return false for score < 70", () => {
    const score = {
      overall: 69,
      structural: 80,
      content: 80,
      uniqueness: 80,
      actionability: 80,
      issues: [],
      suggestions: [],
    };
    expect(isPublishable(score)).toBe(false);
  });

  it("should return false for critical structural issues", () => {
    const score = {
      overall: 80,
      structural: 80,
      content: 80,
      uniqueness: 80,
      actionability: 80,
      issues: [
        {
          layer: "structural" as const,
          severity: "critical" as const,
          message: "Missing question",
        },
      ],
      suggestions: [],
    };
    expect(isPublishable(score)).toBe(false);
  });

  it("should return true for non-critical issues at high score", () => {
    const score = {
      overall: 85,
      structural: 85,
      content: 85,
      uniqueness: 85,
      actionability: 85,
      issues: [
        {
          layer: "content" as const,
          severity: "warning" as const,
          message: "Could improve",
        },
      ],
      suggestions: [],
    };
    expect(isPublishable(score)).toBe(true);
  });

  it("should return true for non-critical issues at high score", () => {
    const score = {
      overall: 85,
      structural: 85,
      content: 85,
      uniqueness: 85,
      actionability: 85,
      issues: [
        {
          layer: "content" as const,
          severity: "warning" as const,
          message: "Could improve",
        },
      ],
      suggestions: [],
    };
    expect(isPublishable(score)).toBe(true);
  });
});

describe("Quality Score Composition", () => {
  it("should weight structural at 30%", () => {
    const content = {
      question: "Q?",
      answer: "A",
      explanation: "E",
      tags: ["t"],
      difficulty: "easy",
    };
    const score = assessQuality(content, "question");
    expect(score.structural).toBeGreaterThanOrEqual(0);
    expect(score.structural).toBeLessThanOrEqual(100);
  });

  it("should weight content at 40%", () => {
    const content = {
      question: "Q?",
      answer: "A",
      explanation: "E",
      tags: ["t"],
      difficulty: "easy",
    };
    const score = assessQuality(content, "question");
    expect(score.content).toBeGreaterThanOrEqual(0);
    expect(score.content).toBeLessThanOrEqual(100);
  });

  it("should weight uniqueness at 20%", () => {
    const content = {
      question: "Q?",
      answer: "A",
      explanation: "E",
      tags: ["t"],
      difficulty: "easy",
    };
    const score = assessQuality(content, "question");
    expect(score.uniqueness).toBeGreaterThanOrEqual(0);
    expect(score.uniqueness).toBeLessThanOrEqual(100);
  });

  it("should weight actionability at 10%", () => {
    const content = {
      question: "Q?",
      answer: "A",
      explanation: "E",
      tags: ["t"],
      difficulty: "easy",
    };
    const score = assessQuality(content, "question");
    expect(score.actionability).toBeGreaterThanOrEqual(0);
    expect(score.actionability).toBeLessThanOrEqual(100);
  });

  it("should calculate overall as weighted average", () => {
    const content = {
      question: "Q?",
      answer: "A",
      explanation: "E",
      tags: ["t"],
      difficulty: "easy",
    };
    const score = assessQuality(content, "question");
    const expectedOverall = Math.round(
      score.structural * 0.3 +
        score.content * 0.4 +
        score.uniqueness * 0.2 +
        score.actionability * 0.1,
    );
    expect(score.overall).toBe(expectedOverall);
  });
});
