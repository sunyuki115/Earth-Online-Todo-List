export interface SubTaskType {
  id: string
  title: string
  completed: boolean
  completedAt: string | null
  createdAt: string
}

export interface FocusSessionType {
  id: string
  duration: number
  startedAt: string
  createdAt: string
}

export interface TaskType {
  id: string
  title: string
  type: string
  completionMode: string | null
  completed: boolean
  archived: boolean
  xpReward: number
  coinReward: number
  completedAt: string | null
  archivedAt: string | null
  createdAt: string
  subTasks: SubTaskType[]
  checkIns: string[]
  focusSessions: FocusSessionType[]
}

export interface UserInfo {
  id?: string
  name: string
  email?: string
  birthday: string
  level: number
  xp: number
  coins: number
  levelTitle: string
  xpToNextLevel: number
  survivalDays: number
  totalTasks?: number
  completedTasks?: number
  isGuest?: boolean
}
