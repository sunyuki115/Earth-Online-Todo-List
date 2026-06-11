import { GACHA_ITEMS, type CollectionEntry } from "./gacha"
import { calculateStreak } from "./rewards"

// ============================================
// ACHIEVEMENT SYSTEM - Config, Check & Storage
// ============================================

export interface AchievementTier {
  star: 1 | 2 | 3
  threshold: number
  conditionText: string
}

export interface AchievementDef {
  id: string
  icon: string
  name: string
  desc: string
  condition: string
  category: "task" | "collect" | "level" | "easter"
  tiers?: AchievementTier[]
}

export interface UnlockedAchievement {
  id: string
  star: number
  unlockedAt: string
}

// --- Reward constants ---
export const ACHIEVEMENT_REWARDS = {
  basic: 10,
  star1: 10,
  star2: 15,
  star3: 20,
} as const

export function getAchievementReward(star: number): number {
  if (star === 3) return ACHIEVEMENT_REWARDS.star3
  if (star === 2) return ACHIEVEMENT_REWARDS.star2
  if (star === 1) return ACHIEVEMENT_REWARDS.star1
  return ACHIEVEMENT_REWARDS.basic
}

// --- Achievement definitions ---
export const ACHIEVEMENTS: AchievementDef[] = [
  // ===== 任务类 (7) =====
  {
    id: "first_task",
    icon: "🌱",
    name: "初来乍到",
    desc: "「欢迎来到地球Online」",
    condition: "完成第一个任务",
    category: "task",
  },
  {
    id: "first_main",
    icon: "🗡️",
    name: "主线玩家",
    desc: "「故事的序章已经开启，继续向前吧」",
    condition: "完成第一个主线任务",
    category: "task",
  },
  {
    id: "daily_grind",
    icon: "⚔️",
    name: "肝帝",
    desc: "「已检测到角色活跃行为，奖励结算中」",
    condition: "单日完成任务数",
    category: "task",
    tiers: [
      { star: 1, threshold: 5, conditionText: "单日完成5个任务" },
      { star: 2, threshold: 10, conditionText: "单日完成10个任务" },
      { star: 3, threshold: 20, conditionText: "单日完成20个任务" },
    ],
  },
  {
    id: "daily_adventurer",
    icon: "📋",
    name: "日常冒险家",
    desc: "「地球Online存档保存中…」",
    condition: "累计完成日常任务",
    category: "task",
    tiers: [
      { star: 1, threshold: 10, conditionText: "累计完成10个日常任务" },
      { star: 2, threshold: 20, conditionText: "累计完成20个日常任务" },
      { star: 3, threshold: 40, conditionText: "累计完成40个日常任务" },
    ],
  },
  {
    id: "main_conqueror",
    icon: "🏔️",
    name: "主线征服者",
    desc: "「地球Online主线剧情推进中..」",
    condition: "累计完成主线任务",
    category: "task",
    tiers: [
      { star: 1, threshold: 5, conditionText: "累计完成5个主线任务" },
      { star: 2, threshold: 10, conditionText: "累计完成10个主线任务" },
      { star: 3, threshold: 20, conditionText: "累计完成20个主线任务" },
    ],
  },
  {
    id: "streak_fire",
    icon: "🔥",
    name: "不灭之火",
    desc: "「地球Online签到奖励已发放」",
    condition: "连续打卡天数",
    category: "task",
    tiers: [
      { star: 1, threshold: 7, conditionText: "连续打卡7天" },
      { star: 2, threshold: 14, conditionText: "连续打卡14天" },
      { star: 3, threshold: 28, conditionText: "连续打卡28天" },
    ],
  },
  {
    id: "focus_master",
    icon: "🍅",
    name: "时间管理大师",
    desc: "「已计入地球Online在线时长」",
    condition: "累计专注时长",
    category: "task",
    tiers: [
      { star: 1, threshold: 5, conditionText: "累计专注5小时" },
      { star: 2, threshold: 10, conditionText: "累计专注10小时" },
      { star: 3, threshold: 20, conditionText: "累计专注20小时" },
    ],
  },

  // ===== 收集类 (6) =====
  {
    id: "first_gacha",
    icon: "🎰",
    name: "试试手气吧",
    desc: "「开赌！」",
    condition: "第一次扭蛋",
    category: "collect",
  },
  {
    id: "legendary_pull",
    icon: "👑",
    name: "欧皇",
    desc: "「概率10%，但你赢了」",
    condition: "获得第一个★★★传说级物品",
    category: "collect",
  },
  {
    id: "category_complete",
    icon: "📖",
    name: "大大收藏家",
    desc: "「恭喜解锁该区域全部内容」",
    condition: "图鉴中任意一个品类集齐",
    category: "collect",
  },
  {
    id: "full_codex",
    icon: "🏆",
    name: "全图鉴收集者",
    desc: "「现在，开始探索你的个人图鉴吧」",
    condition: "图鉴全部集齐",
    category: "collect",
  },
  {
    id: "free_spin",
    icon: "🎫",
    name: "薅羊毛",
    desc: "「省到就是赚到」",
    condition: "使用优惠券免费扭蛋1次",
    category: "collect",
  },
  {
    id: "gacha_addict",
    icon: "🎲",
    name: "扭蛋达人",
    desc: "「老板，我又来了」",
    condition: "累计扭蛋次数",
    category: "collect",
    tiers: [
      { star: 1, threshold: 10, conditionText: "累计扭蛋10次" },
      { star: 2, threshold: 20, conditionText: "累计扭蛋20次" },
      { star: 3, threshold: 40, conditionText: "累计扭蛋40次" },
    ],
  },

  // ===== 等级类 (3) =====
  {
    id: "level_10",
    icon: "⭐",
    name: "常驻居民玩家",
    desc: "「翻开故事的下一页吧」",
    condition: "达到 Lv.10",
    category: "level",
  },
  {
    id: "level_30",
    icon: "🌟",
    name: "隔壁家的魔法师",
    desc: "「老玩家，求带带」",
    condition: "达到 Lv.30",
    category: "level",
  },
  {
    id: "level_50",
    icon: "💫",
    name: "传说中的勇者",
    desc: "「Bravo！足够精彩的篇章」",
    condition: "达到 Lv.50",
    category: "level",
  },

  // ===== 彩蛋类 (3) =====
  {
    id: "night_owl",
    icon: "🦉",
    name: "夜猫子",
    desc: "「不过，记得早点休息」",
    condition: "凌晨2:00-5:00完成任务",
    category: "easter",
  },
  {
    id: "early_bird",
    icon: "🌅",
    name: "早起鸟",
    desc: "「早起的鸟儿有虫吃」",
    condition: "早上6:00前完成任务",
    category: "easter",
  },
  {
    id: "restart",
    icon: "🔄",
    name: "Restart！",
    desc: "「祝你永远有重新开始的勇气」",
    condition: "某打卡任务断卡7天后重新打卡",
    category: "easter",
  },
]

// --- localStorage helpers ---
const ACHIEVEMENTS_KEY = "earth_online_achievements"
const GACHA_SPINS_KEY = "earth_online_gacha_spins"
const FREE_SPIN_KEY = "earth_online_used_free_spin"

export function loadAchievements(): UnlockedAchievement[] {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(ACHIEVEMENTS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch { return [] }
}

export function saveAchievements(list: UnlockedAchievement[]): void {
  if (typeof window === "undefined") return
  try { localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(list)) } catch {}
}

export function loadGachaSpinCount(): number {
  if (typeof window === "undefined") return 0
  try {
    const stored = localStorage.getItem(GACHA_SPINS_KEY)
    return stored ? parseInt(stored, 10) : 0
  } catch { return 0 }
}

export function saveGachaSpinCount(count: number): void {
  if (typeof window === "undefined") return
  try { localStorage.setItem(GACHA_SPINS_KEY, String(count)) } catch {}
}

export function loadUsedFreeSpin(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem(FREE_SPIN_KEY) === "true"
}

export function saveUsedFreeSpin(): void {
  if (typeof window === "undefined") return
  try { localStorage.setItem(FREE_SPIN_KEY, "true") } catch {}
}

// --- Check logic ---

interface TaskForCheck {
  id: string
  type: string
  completed: boolean
  completedAt: string | null
  completionMode: string | null
  checkIns: string[]
  focusSessions: { duration: number }[]
}

export interface AchievementCheckContext {
  tasks: TaskForCheck[]
  userLevel: number
  gachaCollection: CollectionEntry[]
  gachaSpinCount: number
  usedFreeSpin: boolean
  currentUnlocked: UnlockedAchievement[]
  taskJustCompleted: boolean
}

function getCurrentStar(id: string, unlocked: UnlockedAchievement[]): number {
  const found = unlocked.find(a => a.id === id)
  return found ? found.star : -1
}


function hasRestartAfterGap(checkIns: string[]): boolean {
  if (checkIns.length < 2) return false
  const sorted = [...checkIns].sort()
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1])
    const curr = new Date(sorted[i])
    const gapDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
    if (gapDays >= 7) return true
  }
  return false
}

export function checkAchievements(ctx: AchievementCheckContext): UnlockedAchievement[] {
  const { tasks, userLevel, gachaCollection, gachaSpinCount, usedFreeSpin, currentUnlocked, taskJustCompleted } = ctx
  const newUnlocks: UnlockedAchievement[] = []
  const now = new Date()

  const completedTasks = tasks.filter(t => t.completed)
  const completedDaily = completedTasks.filter(t => t.type === "DAILY")
  const completedMain = completedTasks.filter(t => t.type === "MAIN")

  const today = now.toISOString().split("T")[0]
  const completedToday = completedTasks.filter(t => {
    if (!t.completedAt) return false
    return t.completedAt.startsWith(today)
  })

  const maxStreak = tasks
    .filter(t => t.completionMode === "CHECKIN" && t.checkIns.length > 0)
    .reduce((max, t) => Math.max(max, calculateStreak(t.checkIns)), 0)

  const totalFocusMinutes = tasks
    .flatMap(t => t.focusSessions)
    .reduce((sum, s) => sum + s.duration, 0)
  const totalFocusHours = totalFocusMinutes / 60

  const collectedIds = new Set(gachaCollection.map(e => e.itemId))

  const hour = now.getHours()

  function tryUnlock(id: string, star: number = 0) {
    const currentStar = getCurrentStar(id, currentUnlocked)
    if (star > currentStar) {
      newUnlocks.push({ id, star, unlockedAt: now.toISOString() })
    }
  }

  function checkTiered(id: string, value: number, def: AchievementDef) {
    if (!def.tiers) return
    for (const tier of def.tiers) {
      if (value >= tier.threshold) {
        tryUnlock(id, tier.star)
      }
    }
  }

  for (const def of ACHIEVEMENTS) {
    switch (def.id) {
      case "first_task":
        if (completedTasks.length > 0) tryUnlock(def.id)
        break
      case "first_main":
        if (completedMain.length > 0) tryUnlock(def.id)
        break
      case "daily_grind":
        checkTiered(def.id, completedToday.length, def)
        break
      case "daily_adventurer":
        checkTiered(def.id, completedDaily.length, def)
        break
      case "main_conqueror":
        checkTiered(def.id, completedMain.length, def)
        break
      case "streak_fire":
        checkTiered(def.id, maxStreak, def)
        break
      case "focus_master":
        checkTiered(def.id, totalFocusHours, def)
        break
      case "first_gacha":
        if (gachaSpinCount >= 1) tryUnlock(def.id)
        break
      case "legendary_pull": {
        const has3Star = gachaCollection.some(e => {
          const item = GACHA_ITEMS.find(i => i.id === e.itemId)
          return item && item.rarity === 3
        })
        if (has3Star) tryUnlock(def.id)
        break
      }
      case "category_complete": {
        const categories = ["food", "equip", "coupon", "lore"] as const
        for (const cat of categories) {
          const catItems = GACHA_ITEMS.filter(i => i.category === cat)
          const allCollected = catItems.every(i => collectedIds.has(i.id))
          if (allCollected) { tryUnlock(def.id); break }
        }
        break
      }
      case "full_codex": {
        const allCollected = GACHA_ITEMS.every(i => collectedIds.has(i.id))
        if (allCollected) tryUnlock(def.id)
        break
      }
      case "free_spin":
        if (usedFreeSpin) tryUnlock(def.id)
        break
      case "gacha_addict":
        checkTiered(def.id, gachaSpinCount, def)
        break
      case "level_10":
        if (userLevel >= 10) tryUnlock(def.id)
        break
      case "level_30":
        if (userLevel >= 30) tryUnlock(def.id)
        break
      case "level_50":
        if (userLevel >= 50) tryUnlock(def.id)
        break
      case "night_owl":
        if (taskJustCompleted && hour >= 2 && hour < 5) tryUnlock(def.id)
        break
      case "early_bird":
        if (taskJustCompleted && hour < 6) tryUnlock(def.id)
        break
      case "restart": {
        const hasRestart = tasks
          .filter(t => t.completionMode === "CHECKIN" && t.checkIns.length >= 2)
          .some(t => hasRestartAfterGap(t.checkIns))
        if (hasRestart) tryUnlock(def.id)
        break
      }
    }
  }

  return newUnlocks
}

export function applyAchievementUnlocks(
  currentUnlocked: UnlockedAchievement[],
  newUnlocks: UnlockedAchievement[]
): UnlockedAchievement[] {
  const result = [...currentUnlocked]
  for (const unlock of newUnlocks) {
    const idx = result.findIndex(a => a.id === unlock.id)
    if (idx >= 0) {
      result[idx] = unlock
    } else {
      result.push(unlock)
    }
  }
  return result
}

export function getAchievementById(id: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find(a => a.id === id)
}

export function getSortedAchievements(unlocked: UnlockedAchievement[]): AchievementDef[] {
  const unlockedIds = new Set(unlocked.map(a => a.id))
  const unlockedDefs = ACHIEVEMENTS.filter(a => unlockedIds.has(a.id))
  const lockedDefs = ACHIEVEMENTS.filter(a => !unlockedIds.has(a.id))
  return [...unlockedDefs, ...lockedDefs]
}

export function getStarDisplay(star: number): string {
  if (star === 3) return "★★★"
  if (star === 2) return "★★"
  if (star === 1) return "★"
  return ""
}

export function getNextTierCondition(def: AchievementDef, currentStar: number): string | null {
  if (!def.tiers) return null
  const nextTier = def.tiers.find(t => t.star > currentStar)
  return nextTier ? nextTier.conditionText : null
}
