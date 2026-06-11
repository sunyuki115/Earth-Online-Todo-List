export const REWARDS = {
  DAILY_COMPLETE: { xp: 10, coins: 5 },
  MAIN_COMPLETE: { xp: 20, coins: 10 },
  SUBTASK_COMPLETE: { xp: 10, coins: 5 },
  CHECKIN: { xp: 10, coins: 5 },
} as const

export function getFocusReward(durationMinutes: number) {
  const map: Record<number, { xp: number; coins: number }> = {
    30: { xp: 4, coins: 2 },
    45: { xp: 6, coins: 3 },
    60: { xp: 8, coins: 4 },
  }
  return map[durationMinutes] ?? { xp: 4, coins: 2 }
}

export function getLevelTitle(level: number): string {
  if (level <= 2) return "地球新手"
  if (level <= 4) return "初出茅庐"
  if (level <= 6) return "崭露头角"
  if (level <= 9) return "小有成就"
  if (level <= 14) return "老练冒险者"
  if (level <= 19) return "地球精英"
  if (level <= 29) return "大师冒险者"
  return "传奇勇者"
}

export function xpForLevel(level: number): number {
  return level * 100
}

export function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0
  const sorted = [...dates].sort().reverse()
  const today = new Date().toISOString().split("T")[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]
  if (sorted[0] !== today && sorted[0] !== yesterday) return 0
  let streak = 1
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1])
    const curr = new Date(sorted[i])
    const diffDays = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24)
    if (diffDays === 1) {
      streak++
    } else {
      break
    }
  }
  return streak
}

export function getSurvivalDays(birthday: Date | string): number {
  const now = new Date()
  const birth = new Date(birthday)
  const diff = now.getTime() - birth.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export function applyReward(
  user: { xp: number; level: number; coins: number },
  reward: { xp: number; coins: number }
): { xp: number; level: number; coins: number; leveledUp: boolean; newLevel: number } {
  let xp = user.xp + reward.xp
  let coins = user.coins + reward.coins
  let level = user.level
  let leveledUp = false
  let newLevel = 0

  const oldLevel = level
  while (xp >= xpForLevel(level)) {
    xp -= xpForLevel(level)
    level += 1
    coins += level * 10
  }

  if (level > oldLevel) {
    leveledUp = true
    newLevel = level
  }

  return { xp, level, coins, leveledUp, newLevel }
}
