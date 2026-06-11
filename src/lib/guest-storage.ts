import { type UserInfo, type TaskType } from "@/types"
import { getLevelTitle, xpForLevel, applyReward } from "@/lib/rewards"

// ==================== HELPERS ====================
export function generateId(): string {
  return "local_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9)
}

// ==================== LOCAL STORAGE HELPERS ====================
const GUEST_USER_KEY = "earth_online_guest_user"
const GUEST_TASKS_KEY = "earth_online_guest_tasks"

export function getDefaultGuestUser(): UserInfo {
  return {
    name: "冒险者",
    birthday: "2000-01-01",
    level: 1,
    xp: 0,
    coins: 0,
    levelTitle: getLevelTitle(1),
    xpToNextLevel: xpForLevel(1),
    survivalDays: 0,
    isGuest: true,
  }
}

export function loadGuestUser(): UserInfo {
  if (typeof window === "undefined") return getDefaultGuestUser()
  try {
    const stored = localStorage.getItem(GUEST_USER_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      parsed.levelTitle = getLevelTitle(parsed.level)
      parsed.xpToNextLevel = xpForLevel(parsed.level)
      parsed.isGuest = true
      delete parsed.streakDays
      delete parsed.lastActiveDate
      return parsed
    }
  } catch {}
  return getDefaultGuestUser()
}

export function saveGuestUser(user: UserInfo): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(GUEST_USER_KEY, JSON.stringify(user))
  } catch {}
}

export function loadGuestTasks(): TaskType[] {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(GUEST_TASKS_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return []
}

export function saveGuestTasks(tasks: TaskType[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(GUEST_TASKS_KEY, JSON.stringify(tasks))
  } catch {}
}

// Guest mode reward logic
export function processGuestReward(user: UserInfo, reward: { xp: number; coins: number }): { updatedUser: UserInfo; leveledUp: boolean; newLevel: number } {
  const result = applyReward(user, reward)

  const updatedUser: UserInfo = {
    ...user,
    xp: result.xp,
    coins: result.coins,
    level: result.level,
    levelTitle: getLevelTitle(result.level),
    xpToNextLevel: xpForLevel(result.level),
  }
  saveGuestUser(updatedUser)
  return { updatedUser, leveledUp: result.leveledUp, newLevel: result.newLevel }
}
