import { getRedisClient, isRedisAvailable } from './singleton.js'

const LEADERBOARD_PREFIX = 'devprep:leaderboard:'

export interface LeaderboardEntry {
  member: string
  score: number
  rank: number
}

export interface LeaderboardOptions {
  ascending?: boolean
  withScores?: boolean
  withRank?: boolean
}

export interface MemberScore {
  member: string
  score: number
}

export interface AggregatedScore {
  member: string
  totalScore: number
}

export function createLeaderboard(name: string): Leaderboard {
  return new Leaderboard(name)
}

export class Leaderboard {
  private name: string

  constructor(name: string) {
    this.name = name
  }

  private getKey(): string {
    return `${LEADERBOARD_PREFIX}${this.name}`
  }

  async addMember(member: string, score: number): Promise<boolean> {
    if (!isRedisAvailable()) return false
    const client = getRedisClient()
    if (!client) return false

    try {
      const key = this.getKey()
      await client.zadd(key, score, member)
      return true
    } catch (error) {
      console.error('[Leaderboard] Error adding member:', (error as Error).message)
      return false
    }
  }

  async addMembers(members: MemberScore[]): Promise<boolean> {
    if (!isRedisAvailable()) return false
    const client = getRedisClient()
    if (!client) return false

    try {
      const key = this.getKey()
      const args: (string | number)[] = []

      for (const { member, score } of members) {
        args.push(score, member)
      }

      await client.zadd(key, ...args)
      return true
    } catch (error) {
      console.error('[Leaderboard] Error adding members:', (error as Error).message)
      return false
    }
  }

  async updateScore(member: string, score: number): Promise<boolean> {
    if (!isRedisAvailable()) return false
    const client = getRedisClient()
    if (!client) return false

    try {
      const key = this.getKey()
      await client.zadd(key, score, member)
      return true
    } catch (error) {
      console.error('[Leaderboard] Error updating score:', (error as Error).message)
      return false
    }
  }

  async incrementScore(member: string, increment: number): Promise<number | null> {
    if (!isRedisAvailable()) return null
    const client = getRedisClient()
    if (!client) return null

    try {
      const key = this.getKey()
      const newScore = await client.zincrby(key, increment, member)
      return parseFloat(newScore)
    } catch (error) {
      console.error('[Leaderboard] Error incrementing score:', (error as Error).message)
      return null
    }
  }

  async decrementScore(member: string, decrement: number): Promise<number | null> {
    return this.incrementScore(member, -decrement)
  }

  async getScore(member: string): Promise<number | null> {
    if (!isRedisAvailable()) return null
    const client = getRedisClient()
    if (!client) return null

    try {
      const key = this.getKey()
      const score = await client.zscore(key, member)
      return score !== null ? parseFloat(score) : null
    } catch (error) {
      console.error('[Leaderboard] Error getting score:', (error as Error).message)
      return null
    }
  }

  async getRank(member: string, ascending: boolean = true): Promise<number | null> {
    if (!isRedisAvailable()) return null
    const client = getRedisClient()
    if (!client) return null

    try {
      const key = this.getKey()
      const rank = ascending ? await client.zrank(key, member) : await client.zrevrank(key, member)

      return rank !== null ? rank + 1 : null
    } catch (error) {
      console.error('[Leaderboard] Error getting rank:', (error as Error).message)
      return null
    }
  }

  async getEntry(member: string): Promise<LeaderboardEntry | null> {
    if (!isRedisAvailable()) return null
    const client = getRedisClient()
    if (!client) return null

    try {
      const key = this.getKey()
      const [score, rank] = await Promise.all([
        client.zscore(key, member),
        client.zrevrank(key, member),
      ])

      if (score === null || rank === null) return null

      return {
        member,
        score: parseFloat(score),
        rank: rank + 1,
      }
    } catch (error) {
      console.error('[Leaderboard] Error getting entry:', (error as Error).message)
      return null
    }
  }

  async getTop(count: number, offset: number = 0): Promise<LeaderboardEntry[]> {
    if (!isRedisAvailable()) return []
    const client = getRedisClient()
    if (!client) return []

    try {
      const key = this.getKey()
      const results = await client.zrevrange(key, offset, offset + count - 1, 'WITHSCORES')

      const entries: LeaderboardEntry[] = []
      for (let i = 0; i < results.length; i += 2) {
        entries.push({
          member: results[i],
          score: parseFloat(results[i + 1]),
          rank: offset + Math.floor(i / 2) + 1,
        })
      }

      return entries
    } catch (error) {
      console.error('[Leaderboard] Error getting top:', (error as Error).message)
      return []
    }
  }

  async getBottom(count: number, offset: number = 0): Promise<LeaderboardEntry[]> {
    if (!isRedisAvailable()) return []
    const client = getRedisClient()
    if (!client) return []

    try {
      const key = this.getKey()
      const results = await client.zrange(key, offset, offset + count - 1, 'WITHSCORES')

      const entries: LeaderboardEntry[] = []
      for (let i = 0; i < results.length; i += 2) {
        entries.push({
          member: results[i],
          score: parseFloat(results[i + 1]),
          rank: offset + Math.floor(i / 2) + 1,
        })
      }

      return entries
    } catch (error) {
      console.error('[Leaderboard] Error getting bottom:', (error as Error).message)
      return []
    }
  }

  async getRange(startRank: number, endRank: number): Promise<LeaderboardEntry[]> {
    if (!isRedisAvailable()) return []
    const client = getRedisClient()
    if (!client) return []

    try {
      const key = this.getKey()
      const results = await client.zrevrange(key, startRank - 1, endRank - 1, 'WITHSCORES')

      const entries: LeaderboardEntry[] = []
      for (let i = 0; i < results.length; i += 2) {
        entries.push({
          member: results[i],
          score: parseFloat(results[i + 1]),
          rank: startRank + Math.floor(i / 2),
        })
      }

      return entries
    } catch (error) {
      console.error('[Leaderboard] Error getting range:', (error as Error).message)
      return []
    }
  }

  async getScoresForMembers(members: string[]): Promise<Map<string, number | null>> {
    if (!isRedisAvailable()) return new Map()
    const client = getRedisClient()
    if (!client) return new Map()

    try {
      const key = this.getKey()
      const pipeline = client.pipeline()

      for (const member of members) {
        pipeline.zscore(key, member)
      }

      const results = await pipeline.exec()
      if (!results) return new Map()

      const scores = new Map<string, number | null>()
      members.forEach((member, index) => {
        const result = results[index] as [Error | null, unknown] | undefined
        const [err, score] = result ?? [null, null]
        scores.set(member, err ? null : score !== null ? parseFloat(String(score)) : null)
      })

      return scores
    } catch (error) {
      console.error('[Leaderboard] Error getting scores for members:', (error as Error).message)
      return new Map()
    }
  }

  async getRanksForMembers(members: string[]): Promise<Map<string, number | null>> {
    if (!isRedisAvailable()) return new Map()
    const client = getRedisClient()
    if (!client) return new Map()

    try {
      const key = this.getKey()
      const pipeline = client.pipeline()

      for (const member of members) {
        pipeline.zrevrank(key, member)
      }

      const results = await pipeline.exec()
      if (!results) return new Map()

      const ranks = new Map<string, number | null>()
      members.forEach((member, index) => {
        const result = results[index] as [Error | null, unknown] | undefined
        const [err, rank] = result ?? [null, undefined]
        ranks.set(member, err || rank === undefined ? null : Number(rank) + 1)
      })

      return ranks
    } catch (error) {
      console.error('[Leaderboard] Error getting ranks for members:', (error as Error).message)
      return new Map()
    }
  }

  async removeMember(member: string): Promise<boolean> {
    if (!isRedisAvailable()) return false
    const client = getRedisClient()
    if (!client) return false

    try {
      const key = this.getKey()
      const removed = await client.zrem(key, member)
      return removed === 1
    } catch (error) {
      console.error('[Leaderboard] Error removing member:', (error as Error).message)
      return false
    }
  }

  async removeMembers(members: string[]): Promise<number> {
    if (!isRedisAvailable()) return 0
    const client = getRedisClient()
    if (!client) return 0

    try {
      const key = this.getKey()
      const removed = await client.zrem(key, ...members)
      return removed
    } catch (error) {
      console.error('[Leaderboard] Error removing members:', (error as Error).message)
      return 0
    }
  }

  async removeBottomRank(count: number): Promise<number> {
    if (!isRedisAvailable()) return 0
    const client = getRedisClient()
    if (!client) return 0

    try {
      const key = this.getKey()
      const removed = await client.zremrangebyrank(key, 0, count - 1)
      return removed
    } catch (error) {
      console.error('[Leaderboard] Error removing bottom ranks:', (error as Error).message)
      return 0
    }
  }

  async removeBelowScore(score: number): Promise<number> {
    if (!isRedisAvailable()) return 0
    const client = getRedisClient()
    if (!client) return 0

    try {
      const key = this.getKey()
      const removed = await client.zremrangebyscore(key, '-inf', score)
      return removed
    } catch (error) {
      console.error('[Leaderboard] Error removing below score:', (error as Error).message)
      return 0
    }
  }

  async getCount(): Promise<number> {
    if (!isRedisAvailable()) return 0
    const client = getRedisClient()
    if (!client) return 0

    try {
      const key = this.getKey()
      const count = await client.zcard(key)
      return count
    } catch (error) {
      console.error('[Leaderboard] Error getting count:', (error as Error).message)
      return 0
    }
  }

  async getTotalScore(): Promise<number> {
    if (!isRedisAvailable()) return 0
    const client = getRedisClient()
    if (!client) return 0

    try {
      const key = this.getKey()
      const members = await client.zrange(key, 0, -1)
      if (members.length === 0) return 0

      const scores = await this.getScoresForMembers(members)
      let total = 0
      scores.forEach(score => {
        if (score !== null) total += score
      })

      return total
    } catch (error) {
      console.error('[Leaderboard] Error getting total score:', (error as Error).message)
      return 0
    }
  }

  async getAverageScore(): Promise<number> {
    const count = await this.getCount()
    if (count === 0) return 0

    const total = await this.getTotalScore()
    return total / count
  }

  async getPercentile(member: string): Promise<number | null> {
    if (!isRedisAvailable()) return null
    const client = getRedisClient()
    if (!client) return null

    try {
      const key = this.getKey()
      const rank = await client.zrevrank(key, member)
      const count = await client.zcard(key)

      if (rank === null || count === 0) return null

      return ((count - rank - 1) / count) * 100
    } catch (error) {
      console.error('[Leaderboard] Error getting percentile:', (error as Error).message)
      return null
    }
  }

  async clear(): Promise<boolean> {
    if (!isRedisAvailable()) return false
    const client = getRedisClient()
    if (!client) return false

    try {
      const key = this.getKey()
      await client.del(key)
      return true
    } catch (error) {
      console.error('[Leaderboard] Error clearing:', (error as Error).message)
      return false
    }
  }

  async exists(member: string): Promise<boolean> {
    if (!isRedisAvailable()) return false
    const client = getRedisClient()
    if (!client) return false

    try {
      const key = this.getKey()
      const score = await client.zscore(key, member)
      return score !== null
    } catch (error) {
      console.error('[Leaderboard] Error checking existence:', (error as Error).message)
      return false
    }
  }

  async getMembersWithScoresBetween(
    minScore: number,
    maxScore: number
  ): Promise<LeaderboardEntry[]> {
    if (!isRedisAvailable()) return []
    const client = getRedisClient()
    if (!client) return []

    try {
      const key = this.getKey()
      const results = await client.zrangebyscore(key, minScore, maxScore, 'WITHSCORES')

      const entries: LeaderboardEntry[] = []
      for (let i = 0; i < results.length; i += 2) {
        const scoreStr = results[i + 1] as string
        const rank = await client.zcount(key, '-inf', scoreStr)
        entries.push({
          member: results[i],
          score: parseFloat(results[i + 1]),
          rank: rank + 1,
        })
      }

      return entries
    } catch (error) {
      console.error('[Leaderboard] Error getting members between scores:', (error as Error).message)
      return []
    }
  }

  async rankMembersInRange(
    startRank: number,
    endRank: number,
    rankBy: 'score' | 'rank' = 'score'
  ): Promise<AggregatedScore[]> {
    if (!isRedisAvailable()) return []
    const client = getRedisClient()
    if (!client) return []

    try {
      const members = await client.zrange(this.getKey(), startRank - 1, endRank - 1)
      const scores = await this.getScoresForMembers(members)

      const aggregated: AggregatedScore[] = []
      scores.forEach((score, member) => {
        if (score !== null) {
          aggregated.push({ member, totalScore: score })
        }
      })

      return aggregated.sort((a, b) => b.totalScore - a.totalScore)
    } catch (error) {
      console.error('[Leaderboard] Error ranking members:', (error as Error).message)
      return []
    }
  }
}

export class MultiLeaderboard {
  private leaderboards: Map<string, Leaderboard> = new Map()

  constructor(leaderboardNames: string[]) {
    for (const name of leaderboardNames) {
      this.leaderboards.set(name, createLeaderboard(name))
    }
  }

  async addScoreToAll(member: string, scores: Record<string, number>): Promise<boolean> {
    const results: boolean[] = []
    for (const [name, score] of Object.entries(scores)) {
      const lb = this.leaderboards.get(name)
      if (lb) {
        results.push(await lb.addMember(member, score))
      }
    }
    return results.every(r => r)
  }

  async incrementScoreInAll(member: string, increments: Record<string, number>): Promise<boolean> {
    const results: (number | null)[] = []
    for (const [name, increment] of Object.entries(increments)) {
      const lb = this.leaderboards.get(name)
      if (lb) {
        results.push(await lb.incrementScore(member, increment))
      }
    }
    return results.every(r => r !== null)
  }

  async getAggregatedRank(
    member: string,
    weights: Record<string, number> = {}
  ): Promise<number | null> {
    let totalWeightedScore = 0
    let totalWeight = 0

    for (const [name, weight] of Object.entries(weights)) {
      const lb = this.leaderboards.get(name)
      if (lb) {
        const score = await lb.getScore(member)
        if (score !== null) {
          totalWeightedScore += score * weight
          totalWeight += weight
        }
      }
    }

    if (totalWeight === 0) return null
    return totalWeightedScore / totalWeight
  }

  getLeaderboard(name: string): Leaderboard | undefined {
    return this.leaderboards.get(name)
  }
}
