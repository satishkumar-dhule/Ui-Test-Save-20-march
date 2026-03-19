import { describe, it, expect } from "vitest";

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateChannelId(id: string): boolean {
  const validChannels = [
    "javascript",
    "react",
    "algorithms",
    "devops",
    "kubernetes",
    "networking",
    "system-design",
    "aws-saa",
    "aws-dev",
    "cka",
    "terraform",
  ];
  return validChannels.includes(id);
}

function validateUserId(id: string): boolean {
  return typeof id === "string" && id.length >= 1 && id.length <= 255;
}

function validateProgressType(type: string): boolean {
  const validTypes = ["flashcard", "exam", "voice", "coding", "qa"];
  return validTypes.includes(type);
}

function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

describe("Validation Functions", () => {
  describe("validateEmail", () => {
    it("should validate correct email addresses", () => {
      expect(validateEmail("user@example.com")).toBe(true);
      expect(validateEmail("test.user@domain.co")).toBe(true);
      expect(validateEmail("name+tag@company.org")).toBe(true);
    });

    it("should reject invalid email addresses", () => {
      expect(validateEmail("")).toBe(false);
      expect(validateEmail("invalid")).toBe(false);
      expect(validateEmail("no@domain")).toBe(false);
      expect(validateEmail("@nodomain.com")).toBe(false);
      expect(validateEmail("spaces in@email.com")).toBe(false);
    });
  });

  describe("validateChannelId", () => {
    it("should validate correct channel IDs", () => {
      expect(validateChannelId("javascript")).toBe(true);
      expect(validateChannelId("react")).toBe(true);
      expect(validateChannelId("aws-saa")).toBe(true);
      expect(validateChannelId("terraform")).toBe(true);
    });

    it("should reject invalid channel IDs", () => {
      expect(validateChannelId("")).toBe(false);
      expect(validateChannelId("invalid")).toBe(false);
      expect(validateChannelId("JAVASCRIPT")).toBe(false);
      expect(validateChannelId("python")).toBe(false);
    });
  });

  describe("validateUserId", () => {
    it("should validate correct user IDs", () => {
      expect(validateUserId("user123")).toBe(true);
      expect(validateUserId("a")).toBe(true);
      expect(validateUserId("x".repeat(255))).toBe(true);
    });

    it("should reject invalid user IDs", () => {
      expect(validateUserId("")).toBe(false);
      expect(validateUserId("x".repeat(256))).toBe(false);
    });

    it("should reject non-string inputs", () => {
      expect(validateUserId(null as any)).toBe(false);
      expect(validateUserId(undefined as any)).toBe(false);
    });
  });

  describe("validateProgressType", () => {
    it("should validate correct progress types", () => {
      expect(validateProgressType("flashcard")).toBe(true);
      expect(validateProgressType("exam")).toBe(true);
      expect(validateProgressType("voice")).toBe(true);
      expect(validateProgressType("coding")).toBe(true);
      expect(validateProgressType("qa")).toBe(true);
    });

    it("should reject invalid progress types", () => {
      expect(validateProgressType("")).toBe(false);
      expect(validateProgressType("invalid")).toBe(false);
      expect(validateProgressType("FLASHARD")).toBe(false);
    });
  });

  describe("validateUrl", () => {
    it("should validate correct URLs", () => {
      expect(validateUrl("https://example.com")).toBe(true);
      expect(validateUrl("http://localhost:3000")).toBe(true);
      expect(validateUrl("https://api.example.com/v1/users")).toBe(true);
    });

    it("should reject invalid URLs", () => {
      expect(validateUrl("")).toBe(false);
      expect(validateUrl("not-a-url")).toBe(false);
      expect(validateUrl("ftp://invalid")).toBe(false);
    });
  });
});
