import type { User as BaseUser, SpendingRecord } from "./types"

// Extend User type locally to include spendingHistory
type User = BaseUser & { spendingHistory?: SpendingRecord[] }

export function getSpendingForPeriod(user: User, days: number): number {
  if (!user.spendingHistory) return 0

  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)

  return user.spendingHistory
    .filter((record: SpendingRecord) => new Date(record.date) >= cutoffDate)
    .reduce((total: number, record: SpendingRecord) => total + record.amount, 0)
}

export function getDailySpending(user: User): number {
  return getSpendingForPeriod(user, 1)
}

export function getWeeklySpending(user: User): number {
  return getSpendingForPeriod(user, 7)
}

export function canSpend(user: User, amount: number): { canSpend: boolean; reason?: string } {
  if (!user.spendingLimits?.enabled) {
    return { canSpend: true }
  }

  const dailySpent = getDailySpending(user)
  const weeklySpent = getWeeklySpending(user)

  if (dailySpent + amount > user.spendingLimits.dailyLimit) {
    return {
      canSpend: false,
      reason: `Daily spending limit exceeded. You have spent ${dailySpent} gold today (limit: ${user.spendingLimits.dailyLimit})`,
    }
  }

  if (weeklySpent + amount > user.spendingLimits.weeklyLimit) {
    return {
      canSpend: false,
      reason: `Weekly spending limit exceeded. You have spent ${weeklySpent} gold this week (limit: ${user.spendingLimits.weeklyLimit})`,
    }
  }

  return { canSpend: true }
}

export function addSpendingRecord(user: User, amount: number, type: SpendingRecord["type"], description: string): User {
  const newRecord: SpendingRecord = {
    id: Date.now().toString(),
    amount,
    type,
    description,
    date: new Date().toISOString(),
  }

  return {
    ...user,
    spendingHistory: [...(user.spendingHistory || []), newRecord],
  } as User
}
