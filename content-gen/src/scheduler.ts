import type { ContentType, Channel } from "./orchestrator.js";

export interface ChannelStats {
  channelId: string;
  type: ContentType;
  count: number;
  lastGenerated?: Date;
  avgQuality: number;
}

export interface GapScore {
  channelId: string;
  type: ContentType;
  coverage: number;
  diversity: number;
  priority: number;
  gapReason: string[];
}

export interface SchedulerConfig {
  minCoveragePerType: number;
  maxCoveragePerType: number;
  targetTotalContent: number;
  diversityWeight: number;
  coverageWeight: number;
  recencyWeight: number;
  qualityWeight: number;
  certExamBoost: number;
  difficultyDistribution: {
    easy: number;
    medium: number;
    hard: number;
  };
}

export const DEFAULT_CONFIG: SchedulerConfig = {
  minCoveragePerType: 5,
  maxCoveragePerType: 50,
  targetTotalContent: 100,
  diversityWeight: 0.3,
  coverageWeight: 0.4,
  recencyWeight: 0.15,
  qualityWeight: 0.15,
  certExamBoost: 2.0,
  difficultyDistribution: {
    easy: 0.3,
    medium: 0.5,
    hard: 0.2,
  },
};

export interface ContentItem {
  id: string;
  type: ContentType;
  channelId: string;
  difficulty?: "easy" | "medium" | "hard";
  qualityScore?: number;
  createdAt: number;
  tags?: string[];
}

export interface ScheduledTask {
  channelId: string;
  type: ContentType;
  priority: number;
  reason: string;
  difficulty?: "easy" | "medium" | "hard";
}

export class ChannelScheduler {
  private stats: Map<string, ChannelStats> = new Map();
  private recentContent: ContentItem[] = [];
  private config: SchedulerConfig;
  private channels: Map<string, Channel> = new Map();

  constructor(config: Partial<SchedulerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  registerChannel(channel: Channel): void {
    this.channels.set(channel.id, channel);
  }

  getChannel(channelId: string): Channel | undefined {
    return this.channels.get(channelId);
  }

  getAllChannels(): Channel[] {
    return Array.from(this.channels.values());
  }

  private getStatKey(channelId: string, type: ContentType): string {
    return `${channelId}:${type}`;
  }

  private getOrCreateStat(channelId: string, type: ContentType): ChannelStats {
    const key = this.getStatKey(channelId, type);
    if (!this.stats.has(key)) {
      this.stats.set(key, {
        channelId,
        type,
        count: 0,
        avgQuality: 0,
      });
    }
    return this.stats.get(key)!;
  }

  addContent(item: ContentItem): void {
    this.recentContent.push(item);
    if (this.recentContent.length > 1000) {
      this.recentContent = this.recentContent.slice(-500);
    }

    const stat = this.getOrCreateStat(item.channelId, item.type);
    const totalCount = stat.count;
    stat.count++;
    stat.lastGenerated = new Date(item.createdAt);
    stat.avgQuality =
      (stat.avgQuality * totalCount + (item.qualityScore || 0.75)) / stat.count;
  }

  getStats(channelId?: string, type?: ContentType): ChannelStats[] {
    const result: ChannelStats[] = [];
    const iterator =
      channelId && type
        ? [this.getStatKey(channelId, type)]
        : Array.from(this.stats.keys());

    for (const key of iterator) {
      const stat = this.stats.get(key);
      if (stat) {
        if (channelId && stat.channelId !== channelId) continue;
        if (type && stat.type !== type) continue;
        result.push(stat);
      }
    }
    return result;
  }

  calculateCoverage(
    channelId: string,
    type: ContentType,
    totalInCategory: number,
  ): number {
    const stat = this.stats.get(this.getStatKey(channelId, type));
    if (!stat || stat.count === 0) return 0;
    return Math.min(1, stat.count / this.config.targetTotalContent);
  }

  calculateDiversity(channelId: string, type: ContentType): number {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const recentSame = this.recentContent.filter(
      (c) =>
        c.channelId === channelId && c.type === type && c.createdAt > cutoff,
    );

    if (recentSame.length === 0) return 1;
    if (recentSame.length >= 5) return 0;

    const tags = new Set<string>();
    for (const item of recentSame) {
      for (const tag of item.tags || []) {
        tags.add(tag);
      }
    }

    const uniqueRatio = Math.min(1, tags.size / 10);
    const recencyPenalty = recentSame.length * 0.15;

    return Math.max(0, uniqueRatio - recencyPenalty);
  }

  calculateRecencyBoost(channelId: string, type: ContentType): number {
    const stat = this.stats.get(this.getStatKey(channelId, type));
    if (!stat?.lastGenerated) return 1;

    const hoursSince = (Date.now() - stat.lastGenerated.getTime()) / 3600000;

    if (hoursSince < 2) return 0.2;
    if (hoursSince < 12) return 0.5;
    if (hoursSince < 24) return 0.8;
    return 1;
  }

  calculateCertBoost(channelId: string): number {
    const channel = this.channels.get(channelId);
    if (channel?.type === "cert" && channel.certCode) {
      return this.config.certExamBoost;
    }
    return 1;
  }

  calculateGaps(stats: ChannelStats[]): GapScore[] {
    const gaps: GapScore[] = [];
    const channels = this.getAllChannels();
    const contentTypes: ContentType[] = [
      "question",
      "flashcard",
      "exam",
      "voice",
      "coding",
    ];

    const totalContent = this.recentContent.length || 1;

    for (const channel of channels) {
      for (const type of contentTypes) {
        const key = this.getStatKey(channel.id, type);
        const stat = this.stats.get(key);
        const count = stat?.count || 0;

        const coverage = Math.min(1, count / this.config.targetTotalContent);
        const coverageGap = 1 - coverage;

        const diversity = this.calculateDiversity(channel.id, type);

        const recencyBoost = this.calculateRecencyBoost(channel.id, type);

        const certBoost = this.calculateCertBoost(channel.id);

        const recencyBonus =
          coverageGap * this.config.recencyWeight * recencyBoost;
        const diversityBonus = diversity * this.config.diversityWeight;
        const qualityBonus =
          (stat?.avgQuality || 0.75 < 0.7 ? 0.1 : 0) *
          this.config.qualityWeight;

        const priority =
          (coverageGap * this.config.coverageWeight +
            diversityBonus +
            recencyBonus +
            qualityBonus) *
          certBoost;

        const reasons: string[] = [];
        if (count < this.config.minCoveragePerType) {
          reasons.push(
            `Below minimum coverage (${count}/${this.config.minCoveragePerType})`,
          );
        }
        if (coverage < 0.3) {
          reasons.push("Low overall coverage");
        }
        if (diversity < 0.3) {
          reasons.push("Low diversity score");
        }
        if (recencyBoost > 0.8) {
          reasons.push("Not generated recently");
        }
        if (channel.type === "cert") {
          reasons.push("Certification exam channel");
        }

        gaps.push({
          channelId: channel.id,
          type,
          coverage,
          diversity,
          priority,
          gapReason: reasons,
        });
      }
    }

    return gaps.sort((a, b) => b.priority - a.priority);
  }

  suggestNextTasks(count: number = 10): ScheduledTask[] {
    const gaps = this.calculateGaps([]);
    const suggestions: ScheduledTask[] = [];
    const usedKeys = new Set<string>();

    for (const gap of gaps) {
      if (suggestions.length >= count) break;

      const key = `${gap.channelId}:${gap.type}`;
      if (usedKeys.has(key)) continue;

      const channel = this.channels.get(gap.channelId);
      if (!channel) continue;

      const difficulty = this.selectDifficulty(gap.type);

      suggestions.push({
        channelId: gap.channelId,
        type: gap.type,
        priority: gap.priority,
        reason: gap.gapReason.join(", ") || "Balanced coverage needed",
        difficulty,
      });

      usedKeys.add(key);
    }

    return suggestions;
  }

  private selectDifficulty(type: ContentType): "easy" | "medium" | "hard" {
    const { easy, medium, hard } = this.config.difficultyDistribution;
    const rand = Math.random();

    if (rand < easy) return "easy";
    if (rand < easy + medium) return "medium";
    return "hard";
  }

  ensureDifficultyDistribution(
    channelId: string,
    type: ContentType,
  ): "easy" | "medium" | "hard" | null {
    const recentItems = this.recentContent
      .filter((c) => c.channelId === channelId && c.type === type)
      .slice(-50);

    const counts = { easy: 0, medium: 0, hard: 0 };
    for (const item of recentItems) {
      if (item.difficulty) counts[item.difficulty]++;
    }

    const total = recentItems.length || 1;
    const { easy, medium, hard } = this.config.difficultyDistribution;

    const easyRatio = counts.easy / total;
    const mediumRatio = counts.medium / total;
    const hardRatio = counts.hard / total;

    if (easyRatio < easy * 0.8) return "easy";
    if (hardRatio < hard * 0.8) return "hard";
    if (mediumRatio > medium * 1.5) {
      return Math.random() < 0.5 ? "easy" : "hard";
    }

    return null;
  }

  getChannelBalanceReport(): {
    channelId: string;
    totalContent: number;
    byType: Record<ContentType, number>;
    balance: number;
    recommendations: string[];
  }[] {
    const channels = this.getAllChannels();
    const report: ReturnType<typeof this.getChannelBalanceReport> = [];

    for (const channel of channels) {
      const byType: Record<ContentType, number> = {
        question: 0,
        flashcard: 0,
        exam: 0,
        voice: 0,
        coding: 0,
      };

      let total = 0;
      for (const [key, stat] of this.stats) {
        if (stat.channelId === channel.id) {
          byType[stat.type] = stat.count;
          total += stat.count;
        }
      }

      const values = Object.values(byType);
      const avg = values.reduce((a, b) => a + b, 0) / values.length || 1;
      const variance =
        values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) /
        values.length;
      const balance = 1 - Math.min(1, Math.sqrt(variance) / (avg || 1));

      const recommendations: string[] = [];
      for (const [type, count] of Object.entries(byType)) {
        if (count < this.config.minCoveragePerType) {
          recommendations.push(
            `Add more ${type} content (current: ${count}, min: ${this.config.minCoveragePerType})`,
          );
        }
      }

      if (balance < 0.5) {
        recommendations.push("High imbalance detected across content types");
      }

      report.push({
        channelId: channel.id,
        totalContent: total,
        byType,
        balance,
        recommendations,
      });
    }

    return report;
  }

  shouldGenerate(
    channelId: string,
    type: ContentType,
    currentQueueSize: number,
  ): { should: boolean; reason: string } {
    const stat = this.stats.get(this.getStatKey(channelId, type));
    const count = stat?.count || 0;

    if (count >= this.config.maxCoveragePerType) {
      return {
        should: false,
        reason: `Maximum coverage reached for ${type} in ${channelId}`,
      };
    }

    if (count < this.config.minCoveragePerType) {
      return {
        should: true,
        reason: `Minimum coverage not met (${count}/${this.config.minCoveragePerType})`,
      };
    }

    const coverage = this.calculateCoverage(
      channelId,
      type,
      this.recentContent.length,
    );
    const diversity = this.calculateDiversity(channelId, type);

    if (coverage < 0.5 && diversity > 0.5) {
      return {
        should: true,
        reason: "Room for more content with good diversity",
      };
    }

    if (currentQueueSize > 20) {
      return { should: false, reason: "Queue is too full" };
    }

    if (diversity < 0.2) {
      return { should: true, reason: "Need more diverse content" };
    }

    const gaps = this.calculateGaps([]);
    const gap = gaps.find((g) => g.channelId === channelId && g.type === type);

    if (gap && gap.priority > 0.3) {
      return {
        should: true,
        reason: `High priority gap (${gap.priority.toFixed(2)})`,
      };
    }

    return { should: false, reason: "Channel/type is sufficiently covered" };
  }
}

export function createScheduler(
  config?: Partial<SchedulerConfig>,
  channels?: Channel[],
): ChannelScheduler {
  const scheduler = new ChannelScheduler(config);
  for (const channel of channels || []) {
    scheduler.registerChannel(channel);
  }
  return scheduler;
}
