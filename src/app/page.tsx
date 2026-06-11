"use client"

import { useSession, signOut } from "next-auth/react"
import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { REWARDS, getFocusReward } from "@/lib/rewards"
import {
  GACHA_COST,
  drawGacha, loadCollection, saveCollection, loadCoupons, saveCoupons,
  addToCollection,
  type GachaItem, type CollectionEntry, type GachaResult,
} from "@/lib/gacha"
import {
  loadAchievements, saveAchievements,
  loadGachaSpinCount, saveGachaSpinCount,
  loadUsedFreeSpin, saveUsedFreeSpin,
  checkAchievements, applyAchievementUnlocks,
  getAchievementReward,
  type UnlockedAchievement, type AchievementCheckContext,
} from "@/lib/achievements"
import { type TaskType, type UserInfo } from "@/types"
import {
  generateId, loadGuestUser, saveGuestUser,
  loadGuestTasks, saveGuestTasks, processGuestReward,
} from "@/lib/guest-storage"
import { AuthModal } from "@/components/AuthModal"
import { CharacterPanel } from "@/components/CharacterPanel"
import { TaskSection } from "@/components/TaskSection"
import { DailyTaskItem } from "@/components/DailyTaskItem"
import { MainTaskItem } from "@/components/MainTaskItem"
import { CreateTaskModal } from "@/components/CreateTaskModal"
import { GachaModal } from "@/components/GachaModal"
import { GachaResultModal } from "@/components/GachaResultModal"
import { CodexModal } from "@/components/CodexModal"
import { CodexItemDetail } from "@/components/CodexItemDetail"
import { LevelUpModal } from "@/components/LevelUpModal"
import { AchievementToast } from "@/components/AchievementToast"
import { AchievementModal } from "@/components/AchievementModal"
import { AchievementDetailModal } from "@/components/AchievementDetailModal"

// ==================== MAIN APP ====================
function GameApp() {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<UserInfo | null>(null)
  const [tasks, setTasks] = useState<TaskType[]>([])
  const [showCharacter, setShowCharacter] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [newLevel, setNewLevel] = useState(0)
  const [loadingTasks, setLoadingTasks] = useState(true)
  const [hydrated, setHydrated] = useState(false)

  // Gacha state
  const [showGacha, setShowGacha] = useState(false)
  const [showGachaResult, setShowGachaResult] = useState(false)
  const [gachaResult, setGachaResult] = useState<GachaResult | null>(null)
  const [showCodex, setShowCodex] = useState(false)
  const [showCodexDetail, setShowCodexDetail] = useState(false)
  const [codexDetailItem, setCodexDetailItem] = useState<GachaItem | null>(null)
  const [codexDetailCount, setCodexDetailCount] = useState(0)
  const [gachaCollection, setGachaCollection] = useState<CollectionEntry[]>([])
  const [gachaCoupons, setGachaCoupons] = useState(0)
  const [gachaSpinning, setGachaSpinning] = useState(false)

  // Achievement state
  const [achievements, setAchievements] = useState<UnlockedAchievement[]>([])
  const [showAchievements, setShowAchievements] = useState(false)
  const [showAchievementDetail, setShowAchievementDetail] = useState(false)
  const [achievementDetailId, setAchievementDetailId] = useState<string | null>(null)
  const [achievementToast, setAchievementToast] = useState<{ id: string; star: number } | null>(null)
  const [gachaSpinCount, setGachaSpinCount] = useState(0)

  const clearAchievementToast = useCallback(() => setAchievementToast(null), [])
  const isGuest = !session?.user?.id

  const fetchServerUser = useCallback(async () => {
    try {
      const res = await fetch("/api/user")
      if (res.ok) {
        const data = await res.json()
        setUser({ ...data, isGuest: false })
      }
    } catch (err) {
      console.error("Failed to fetch user:", err)
    }
  }, [])

  const fetchServerTasks = useCallback(async () => {
    try {
      setLoadingTasks(true)
      const res = await fetch("/api/tasks")
      if (res.ok) {
        const data = await res.json()
        setTasks(data)
      }
    } catch (err) {
      console.error("Failed to fetch tasks:", err)
    } finally {
      setLoadingTasks(false)
    }
  }, [])

  const loadGuestData = useCallback(() => {
    const guestUser = loadGuestUser()
    const guestTasks = loadGuestTasks()
    setUser(guestUser)
    setTasks(guestTasks)
    setLoadingTasks(false)
  }, [])

  useEffect(() => {
    if (status === "loading") return
    if (session?.user?.id) {
      fetchServerUser()
      fetchServerTasks()
    } else {
      loadGuestData()
    }
    setHydrated(true)
  }, [session, status, fetchServerUser, fetchServerTasks, loadGuestData])

  // Load gacha collection/coupons/achievements from localStorage
  useEffect(() => {
    setGachaCollection(loadCollection())
    setGachaCoupons(loadCoupons())
    setAchievements(loadAchievements())
    setGachaSpinCount(loadGachaSpinCount())
  }, [])

  // --- Achievement check ---
  const runAchievementCheck = useCallback((
    currentTasks: TaskType[],
    currentUser: UserInfo | null,
    currentCollection: CollectionEntry[],
    currentSpinCount: number,
    taskJustCompleted: boolean,
    currentAchievements?: UnlockedAchievement[],
  ) => {
    if (!currentUser) return
    const unlocked = currentAchievements ?? achievements
    const ctx: AchievementCheckContext = {
      tasks: currentTasks,
      userLevel: currentUser.level,
      gachaCollection: currentCollection,
      gachaSpinCount: currentSpinCount,
      usedFreeSpin: loadUsedFreeSpin(),
      currentUnlocked: unlocked,
      taskJustCompleted,
    }
    const newUnlocks = checkAchievements(ctx)
    if (newUnlocks.length === 0) return

    const updated = applyAchievementUnlocks(unlocked, newUnlocks)
    setAchievements(updated)
    saveAchievements(updated)

    const firstUnlock = newUnlocks[0]
    setAchievementToast({ id: firstUnlock.id, star: firstUnlock.star })

    const totalCoins = newUnlocks.reduce((sum, u) => sum + getAchievementReward(u.star), 0)
    if (totalCoins > 0) {
      const updatedUser = { ...currentUser, coins: currentUser.coins + totalCoins }
      setUser(updatedUser)
      if (currentUser.isGuest) {
        saveGuestUser(updatedUser)
      } else {
        fetch("/api/gacha/spin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ useFree: true, rewardXp: 0, rewardCoins: totalCoins }),
        }).then(res => {
          if (res.ok) return res.json()
        }).then(data => {
          if (data?.user) {
            setUser(prev => prev ? { ...prev, ...data.user, isGuest: false } : prev)
          }
        }).catch(() => {})
      }
    }
  }, [achievements])

  const handleGuestAddTask = (title: string, type: string = "DAILY", completionMode: string | null = null, initialSubTasks?: string[]) => {
    const newTask: TaskType = {
      id: generateId(),
      title,
      type,
      completionMode: type === "MAIN" ? completionMode : null,
      completed: false,
      archived: false,
      xpReward: 10,
      coinReward: 5,
      completedAt: null,
      archivedAt: null,
      createdAt: new Date().toISOString(),
      subTasks: initialSubTasks?.map((st) => ({
        id: generateId(),
        title: st,
        completed: false,
        completedAt: null,
        createdAt: new Date().toISOString(),
      })) ?? [],
      checkIns: [],
      focusSessions: [],
    }
    const updatedTasks = [newTask, ...tasks]
    setTasks(updatedTasks)
    saveGuestTasks(updatedTasks)
  }

  const handleGuestToggleTask = (id: string, completed: boolean) => {
    if (!user) return

    const task = tasks.find((t) => t.id === id)
    if (!task) return

    const reward = task.type === "MAIN" ? REWARDS.MAIN_COMPLETE : REWARDS.DAILY_COMPLETE

    let latestUser = user
    if (completed && !task.completed) {
      const { updatedUser, leveledUp, newLevel: lvl } = processGuestReward(user, reward)
      latestUser = updatedUser
      setUser(updatedUser)
      if (leveledUp && lvl > 0) {
        setNewLevel(lvl)
        setShowLevelUp(true)
      }
    } else if (!completed && task.completed) {
      latestUser = {
        ...user,
        xp: Math.max(0, user.xp - reward.xp),
        coins: Math.max(0, user.coins - reward.coins),
      }
      setUser(latestUser)
      saveGuestUser(latestUser)
    }

    const updatedTasks = tasks.map((t) =>
      t.id === id
        ? { ...t, completed, completedAt: completed ? new Date().toISOString() : null }
        : t
    )
    setTasks(updatedTasks)
    saveGuestTasks(updatedTasks)

    if (completed) {
      setTimeout(() => runAchievementCheck(updatedTasks, latestUser, gachaCollection, gachaSpinCount, true), 100)
    }
  }

  const handleGuestDeleteTask = (id: string) => {
    const updatedTasks = tasks.filter((t) => t.id !== id)
    setTasks(updatedTasks)
    saveGuestTasks(updatedTasks)
  }

  const handleServerAddTask = async (title: string, type: string = "DAILY", completionMode: string | null = null, initialSubTasks?: string[]) => {
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          type,
          completionMode,
          subTasks: initialSubTasks?.map((st) => ({ title: st })),
        }),
      })
      if (res.ok) {
        const newTask = await res.json()
        setTasks((prev) => [newTask, ...prev])
      }
    } catch (err) {
      console.error("Failed to add task:", err)
    }
  }

  const handleServerToggleTask = async (id: string, completed: boolean) => {
    try {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed, completedAt: completed ? new Date().toISOString() : null } : t))
      )
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.user) {
          setUser((prev) => prev ? { ...prev, ...data.user, isGuest: false } : prev)
        }
        if (data.leveledUp && data.newLevel) {
          setNewLevel(data.newLevel)
          setShowLevelUp(true)
        }
        if (completed) {
          setTasks(prev => {
            const updatedTasks = prev.map(t => t.id === id ? { ...t, completed: true, completedAt: new Date().toISOString() } : t)
            const updatedUser = data.user ? { ...data.user, isGuest: false } : user
            setTimeout(() => runAchievementCheck(updatedTasks, updatedUser, gachaCollection, gachaSpinCount, true), 100)
            return updatedTasks
          })
        }
      } else {
        setTasks((prev) =>
          prev.map((t) => (t.id === id ? { ...t, completed: !completed } : t))
        )
      }
    } catch {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: !completed } : t))
      )
    }
  }

  const handleServerDeleteTask = async (id: string) => {
    try {
      setTasks((prev) => prev.filter((t) => t.id !== id))
      await fetch(`/api/tasks/${id}`, { method: "DELETE" })
    } catch {
      fetchServerTasks()
    }
  }

  const handleGuestEditTask = (id: string, title: string) => {
    const updatedTasks = tasks.map((t) => t.id === id ? { ...t, title } : t)
    setTasks(updatedTasks)
    saveGuestTasks(updatedTasks)
  }

  const handleServerEditTask = async (id: string, title: string) => {
    try {
      setTasks((prev) => prev.map((t) => t.id === id ? { ...t, title } : t))
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      })
      if (!res.ok) fetchServerTasks()
    } catch {
      fetchServerTasks()
    }
  }

  // --- SubTask handlers (guest) ---
  const handleGuestToggleSubTask = (taskId: string, subtaskId: string, completed: boolean) => {
    if (!user) return
    const task = tasks.find(t => t.id === taskId)
    const subTask = task?.subTasks.find(s => s.id === subtaskId)
    if (!task || !subTask) return

    if (completed && !subTask.completed) {
      const { updatedUser, leveledUp, newLevel: lvl } = processGuestReward(user, REWARDS.SUBTASK_COMPLETE)
      setUser(updatedUser)
      if (leveledUp && lvl > 0) { setNewLevel(lvl); setShowLevelUp(true) }
    } else if (!completed && subTask.completed) {
      const updatedUser: UserInfo = {
        ...user,
        xp: Math.max(0, user.xp - REWARDS.SUBTASK_COMPLETE.xp),
        coins: Math.max(0, user.coins - REWARDS.SUBTASK_COMPLETE.coins),
      }
      setUser(updatedUser)
      saveGuestUser(updatedUser)
    }

    const updatedTasks = tasks.map(t => t.id === taskId ? {
      ...t,
      subTasks: t.subTasks.map(s => s.id === subtaskId
        ? { ...s, completed, completedAt: completed ? new Date().toISOString() : null }
        : s
      ),
    } : t)
    setTasks(updatedTasks)
    saveGuestTasks(updatedTasks)
  }

  const handleGuestAddSubTask = (taskId: string, title: string) => {
    const updatedTasks = tasks.map(t => t.id === taskId ? {
      ...t,
      subTasks: [...t.subTasks, {
        id: generateId(),
        title,
        completed: false,
        completedAt: null,
        createdAt: new Date().toISOString(),
      }],
    } : t)
    setTasks(updatedTasks)
    saveGuestTasks(updatedTasks)
  }

  const handleGuestDeleteSubTask = (taskId: string, subtaskId: string) => {
    const updatedTasks = tasks.map(t => t.id === taskId ? {
      ...t,
      subTasks: t.subTasks.filter(s => s.id !== subtaskId),
    } : t)
    setTasks(updatedTasks)
    saveGuestTasks(updatedTasks)
  }

  // --- SubTask handlers (server) ---
  const handleServerToggleSubTask = async (taskId: string, subtaskId: string, completed: boolean) => {
    try {
      setTasks(prev => prev.map(t => t.id === taskId ? {
        ...t,
        subTasks: t.subTasks.map(s => s.id === subtaskId
          ? { ...s, completed, completedAt: completed ? new Date().toISOString() : null }
          : s
        ),
      } : t))
      const res = await fetch(`/api/tasks/${taskId}/subtasks`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subtaskId, completed }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.user) {
          setUser(prev => prev ? { ...prev, ...data.user, isGuest: false } : prev)
        }
        if (data.leveledUp && data.newLevel) {
          setNewLevel(data.newLevel)
          setShowLevelUp(true)
        }
      } else {
        fetchServerTasks()
      }
    } catch {
      fetchServerTasks()
    }
  }

  const handleServerAddSubTask = async (taskId: string, title: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/subtasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      })
      if (res.ok) {
        const newSubTask = await res.json()
        setTasks(prev => prev.map(t => t.id === taskId ? {
          ...t,
          subTasks: [...t.subTasks, newSubTask],
        } : t))
      }
    } catch {
      fetchServerTasks()
    }
  }

  const handleServerDeleteSubTask = async (taskId: string, subtaskId: string) => {
    try {
      setTasks(prev => prev.map(t => t.id === taskId ? {
        ...t,
        subTasks: t.subTasks.filter(s => s.id !== subtaskId),
      } : t))
      await fetch(`/api/tasks/${taskId}/subtasks`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subtaskId }),
      })
    } catch {
      fetchServerTasks()
    }
  }

  // --- CheckIn handlers ---
  const handleGuestCheckIn = (taskId: string) => {
    if (!user) return
    const task = tasks.find(t => t.id === taskId)
    if (!task || task.completionMode !== "CHECKIN" || task.completed) return
    const today = new Date().toISOString().split("T")[0]
    if (task.checkIns.includes(today)) return

    const { updatedUser, leveledUp, newLevel: lvl } = processGuestReward(user, REWARDS.CHECKIN)
    setUser(updatedUser)
    if (leveledUp && lvl > 0) { setNewLevel(lvl); setShowLevelUp(true) }

    const updatedTasks = tasks.map(t => t.id === taskId
      ? { ...t, checkIns: [...t.checkIns, today] }
      : t
    )
    setTasks(updatedTasks)
    saveGuestTasks(updatedTasks)
    setTimeout(() => runAchievementCheck(updatedTasks, updatedUser, gachaCollection, gachaSpinCount, false), 100)
  }

  const handleServerCheckIn = async (taskId: string) => {
    try {
      const today = new Date().toISOString().split("T")[0]
      setTasks(prev => prev.map(t => t.id === taskId
        ? { ...t, checkIns: [...t.checkIns, today] }
        : t
      ))
      const res = await fetch(`/api/tasks/${taskId}/checkins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.user) {
          setUser(prev => prev ? { ...prev, ...data.user, isGuest: false } : prev)
        }
        if (data.leveledUp && data.newLevel) {
          setNewLevel(data.newLevel)
          setShowLevelUp(true)
        }
        setTasks(prev => {
          const updatedTasks = prev.map(t => t.id === taskId ? { ...t, checkIns: [...t.checkIns, today] } : t)
          const updatedUser = data.user ? { ...data.user, isGuest: false } : user
          setTimeout(() => runAchievementCheck(updatedTasks, updatedUser, gachaCollection, gachaSpinCount, false), 100)
          return updatedTasks
        })
      } else {
        fetchServerTasks()
      }
    } catch {
      fetchServerTasks()
    }
  }

  const handleGuestCancelCheckIn = (taskId: string) => {
    if (!user) return
    const task = tasks.find(t => t.id === taskId)
    if (!task) return
    const today = new Date().toISOString().split("T")[0]
    if (!task.checkIns.includes(today)) return

    const updatedUser: UserInfo = {
      ...user,
      xp: Math.max(0, user.xp - REWARDS.CHECKIN.xp),
      coins: Math.max(0, user.coins - REWARDS.CHECKIN.coins),
    }
    setUser(updatedUser)
    saveGuestUser(updatedUser)

    const updatedTasks = tasks.map(t => t.id === taskId
      ? { ...t, checkIns: t.checkIns.filter(d => d !== today) }
      : t
    )
    setTasks(updatedTasks)
    saveGuestTasks(updatedTasks)
  }

  const handleServerCancelCheckIn = async (taskId: string) => {
    try {
      const today = new Date().toISOString().split("T")[0]
      setTasks(prev => prev.map(t => t.id === taskId
        ? { ...t, checkIns: t.checkIns.filter(d => d !== today) }
        : t
      ))
      const res = await fetch(`/api/tasks/${taskId}/checkins`, {
        method: "DELETE",
      })
      if (res.ok) {
        const data = await res.json()
        if (data.user) {
          setUser(prev => prev ? { ...prev, ...data.user, isGuest: false } : prev)
        }
      } else {
        fetchServerTasks()
      }
    } catch {
      fetchServerTasks()
    }
  }

  // --- Focus handlers ---
  const handleGuestRecordFocus = (taskId: string, duration: number) => {
    if (!user) return
    const reward = getFocusReward(duration)
    const { updatedUser, leveledUp, newLevel: lvl } = processGuestReward(user, reward)
    setUser(updatedUser)
    if (leveledUp && lvl > 0) { setNewLevel(lvl); setShowLevelUp(true) }

    const updatedTasks = tasks.map(t => t.id === taskId ? {
      ...t,
      focusSessions: [...t.focusSessions, {
        id: generateId(),
        duration,
        startedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      }],
    } : t)
    setTasks(updatedTasks)
    saveGuestTasks(updatedTasks)
    setTimeout(() => runAchievementCheck(updatedTasks, updatedUser, gachaCollection, gachaSpinCount, false), 100)
  }

  const handleServerRecordFocus = async (taskId: string, duration: number) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/focus-sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duration, startedAt: new Date().toISOString() }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.user) {
          setUser(prev => prev ? { ...prev, ...data.user, isGuest: false } : prev)
        }
        if (data.leveledUp && data.newLevel) {
          setNewLevel(data.newLevel)
          setShowLevelUp(true)
        }
        setTasks(prev => {
          const updatedTasks = prev.map(t => t.id === taskId ? {
            ...t, focusSessions: [...t.focusSessions, data.focusSession],
          } : t)
          const updatedUser = data.user ? { ...data.user, isGuest: false } : user
          setTimeout(() => runAchievementCheck(updatedTasks, updatedUser, gachaCollection, gachaSpinCount, false), 100)
          return updatedTasks
        })
      }
    } catch {
      fetchServerTasks()
    }
  }

  const handleAddTask = isGuest ? handleGuestAddTask : handleServerAddTask
  const handleToggleTask = isGuest ? handleGuestToggleTask : handleServerToggleTask
  const handleDeleteTask = isGuest ? handleGuestDeleteTask : handleServerDeleteTask
  const handleEditTask = isGuest ? handleGuestEditTask : handleServerEditTask

  const handleToggleSubTask = isGuest ? handleGuestToggleSubTask : handleServerToggleSubTask
  const handleAddSubTask = isGuest ? handleGuestAddSubTask : handleServerAddSubTask
  const handleDeleteSubTask = isGuest ? handleGuestDeleteSubTask : handleServerDeleteSubTask
  const handleCheckIn = isGuest ? handleGuestCheckIn : handleServerCheckIn
  const handleCancelCheckIn = isGuest ? handleGuestCancelCheckIn : handleServerCancelCheckIn
  const handleRecordFocus = isGuest ? handleGuestRecordFocus : handleServerRecordFocus

  // --- Gacha handlers ---
  const handleGachaSpin = async (useFree: boolean) => {
    if (!user) return
    if (!useFree && user.coins < GACHA_COST) return
    if (gachaSpinning) return

    // Start shake animation
    setGachaSpinning(true)

    // Wait for shake animation (2 seconds)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setGachaSpinning(false)

    let spinResult: GachaResult

    if (isGuest) {
      // Guest: draw client-side, deduct coins + apply reward locally
      spinResult = drawGacha()
      setGachaResult(spinResult)
      let updatedUser = { ...user }
      if (!useFree) {
        updatedUser = { ...updatedUser, coins: updatedUser.coins - GACHA_COST }
      }
      if (spinResult.reward.xp > 0 || spinResult.reward.coins > 0) {
        const { updatedUser: afterReward, leveledUp, newLevel: lvl } = processGuestReward(updatedUser, spinResult.reward)
        updatedUser = afterReward
        if (leveledUp && lvl > 0) {
          setTimeout(() => { setNewLevel(lvl); setShowLevelUp(true) }, 600)
        }
      } else {
        saveGuestUser(updatedUser)
      }
      setUser(updatedUser)
    } else {
      // Server: draw + deduction + reward + level-up all happen server-side
      try {
        const res = await fetch("/api/gacha/spin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ useFree }),
        })
        if (!res.ok) return
        const data = await res.json()
        spinResult = { item: data.item, reward: data.reward, isCoupon: data.isCoupon }
        setGachaResult(spinResult)
        if (data.user) {
          setUser(prev => prev ? { ...prev, ...data.user, isGuest: false } : prev)
        }
        if (data.leveledUp && data.newLevel) {
          setTimeout(() => { setNewLevel(data.newLevel); setShowLevelUp(true) }, 600)
        }
      } catch { return }
    }

    // Clear coupons if free spin was used (after successful spin)
    let currentCoupons = gachaCoupons
    if (useFree) {
      currentCoupons = 0
      setGachaCoupons(0)
      saveCoupons(0)
    }

    // Handle coupon collection
    if (spinResult.isCoupon) {
      const newCoupons = currentCoupons + 1
      setGachaCoupons(newCoupons)
      saveCoupons(newCoupons)
    }

    // Track free spin usage
    if (useFree) {
      saveUsedFreeSpin()
    }

    // Update spin count
    const newSpinCount = gachaSpinCount + 1
    setGachaSpinCount(newSpinCount)
    saveGachaSpinCount(newSpinCount)

    // Add to collection
    const newCollection = addToCollection(gachaCollection, spinResult.item.id)
    setGachaCollection(newCollection)
    saveCollection(newCollection)

    // Show result
    setShowGacha(false)
    setShowGachaResult(true)

    // Check achievements after gacha
    setTimeout(() => runAchievementCheck(tasks, user, newCollection, newSpinCount, false), 200)
  }

  const handleGachaResultClose = () => {
    setShowGachaResult(false)
    setGachaResult(null)
    setShowGacha(true)
  }

  const handleCodexViewItem = (item: GachaItem, count: number) => {
    setCodexDetailItem(item)
    setCodexDetailCount(count)
    setShowCodexDetail(true)
  }

  const handleLogout = async () => {
    setShowCharacter(false)
    await signOut({ redirect: false })
    loadGuestData()
  }

  const handleAuthSuccess = () => {
    setShowAuthModal(false)
    fetchServerUser()
    fetchServerTasks()
  }

  if (status === "loading" || !hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center pixel-bg">
        <div className="pixel-card p-6 text-center">
          <div className="text-5xl mb-4 animate-bounce">🌍</div>
          <p className="pixel-font text-xs text-earth-brown">加载中...</p>
        </div>
      </div>
    )
  }

  const activeTasks = tasks.filter((t) => !t.archived)
  const mainTasks = activeTasks
    .filter((t) => t.type === "MAIN")
    .sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1))
  const dailyTasks = activeTasks
    .filter((t) => t.type === "DAILY")
    .sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1))

  const completedToday = activeTasks.filter((t) => t.completed).length
  const totalToday = activeTasks.length
  const dailyCompleted = dailyTasks.filter((t) => t.completed).length

  return (
    <div className="min-h-screen flex flex-col pixel-bg">
      {/* Pixel Clouds */}
      <div className="pixel-cloud-a" />
      <div className="pixel-cloud-b" />
      <div className="pixel-cloud-c" />
      <div className="pixel-cloud-d" />

      {/* Pixel Cityscape (image background) */}
      <div className="pixel-cityscape" />

      {/* Main Content */}
      <main className="flex-1 p-3 sm:p-4 pt-4 sm:pt-6 max-w-2xl mx-auto w-full pb-24 relative z-10">
        {/* Merged Status Card: Welcome + Header stats + Level/XP */}
        {user && (
          <div className="pixel-card p-4 sm:p-5 mb-4">
            {/* Top row: Stats + Avatar */}
            <div className="flex items-center justify-between gap-3 mb-3">
              {/* Left: Quick stats */}
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-1">
                  <span className="text-xs sm:text-sm">💰</span>
                  <span className="pixel-font text-[10px] text-earth-gold">{user.coins}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs sm:text-sm">📋</span>
                  <span className="pixel-font text-[10px] text-earth-text-light">{completedToday}/{totalToday}</span>
                </div>
              </div>

              {/* Right: Gacha + Avatar */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowGacha(true)}
                  className="pixel-avatar w-9 h-9 sm:w-11 sm:h-11 bg-earth-gold/20 flex items-center justify-center text-xl sm:text-2xl hover:brightness-110"
                  title="扭蛋机"
                >
                  🎰
                </button>
                <button
                  onClick={() => setShowCharacter(true)}
                  className="flex items-center gap-2 hover:brightness-110"
                >
                  <div className="relative">
                    <div className="pixel-avatar w-9 h-9 sm:w-11 sm:h-11 bg-earth-gold/20 flex items-center justify-center text-xl sm:text-2xl">
                      👤
                    </div>
                    {user.isGuest && (
                      <div className="absolute -top-1 -right-1 pixel-tag">
                        游客
                      </div>
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* Welcome text */}
            <div className="text-center mb-3">
              <p className="text-sm sm:text-base text-earth-text leading-relaxed cn-font">
                {user.isGuest
                  ? <>🌍 欢迎来到 <span className="pixel-font">Earth Online</span> ！</>
                  : <>🌍 欢迎来到 <span className="pixel-font">Earth Online</span> ！今天是你来到这里的第{" "}
                      <span className="text-earth-green text-base sm:text-lg">
                        {user.survivalDays.toLocaleString()}
                      </span>{" "}天
                    </>
                }
              </p>
            </div>

            {/* Level + XP + Progress */}
            <div className="flex justify-between items-center mb-1.5">
              <span className="pixel-font text-[9px] sm:text-[10px] text-earth-brown">
                Lv.{user.level} <span className="cn-font text-[11px] sm:text-xs">{user.levelTitle}</span>
              </span>
              <span className="pixel-font text-[9px] sm:text-[10px] text-earth-green">
                {user.xp}/{user.xpToNextLevel} XP
              </span>
            </div>
            <div className="xp-bar-track">
              <div
                className="xp-bar-fill"
                style={{ width: `${Math.floor((user.xp / user.xpToNextLevel) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* + 接取新任务 按钮 */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="pixel-btn bg-earth-cream w-full mb-4 py-3 text-sm cn-font"
        >
          <span className="relative top-[3px]">+</span> 接取新任务
        </button>

        {/* Loading state */}
        {loadingTasks ? (
          <div className="pixel-card p-6 text-center mb-4">
            <div className="text-3xl mb-2 animate-bounce">⏳</div>
            <p className="pixel-font text-[10px] text-earth-text-light">加载任务中...</p>
          </div>
        ) : activeTasks.length === 0 ? (
          <div className="pixel-card p-6 text-center mb-4">
            <div className="text-3xl mb-3">🌙</div>
            <p className="text-xs text-earth-text-light cn-font mb-1">暂无任务</p>
            <p className="text-xs text-earth-text-light cn-font">接取一个冒险任务，开始你的地球online之旅吧！</p>
          </div>
        ) : (
          <>
            {/* ⚔️ 主线任务区域 */}
            {mainTasks.length > 0 && (
              <TaskSection icon="⚔️" title="主线任务" count={String(mainTasks.length)} storageKey="main">
                <div className="space-y-2">
                  <AnimatePresence>
                    {mainTasks.map((task) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                      >
                        <MainTaskItem
                          task={task}
                          onToggle={handleToggleTask}
                          onEdit={handleEditTask}
                          onDelete={handleDeleteTask}
                          onToggleSubTask={handleToggleSubTask}
                          onAddSubTask={handleAddSubTask}
                          onDeleteSubTask={handleDeleteSubTask}
                          onCheckIn={handleCheckIn}
                          onCancelCheckIn={handleCancelCheckIn}
                          onRecordFocus={handleRecordFocus}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </TaskSection>
            )}

            {/* 📋 日常任务区域 */}
            {dailyTasks.length > 0 && (
              <TaskSection
                icon="📋"
                title="日常任务"
                count={`${dailyCompleted}/${dailyTasks.length}`}
                storageKey="daily"
              >
                <div className="space-y-2">
                  <AnimatePresence>
                    {dailyTasks.map((task) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                      >
                        <DailyTaskItem
                          task={task}
                          onToggle={handleToggleTask}
                          onEdit={handleEditTask}
                          onDelete={handleDeleteTask}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </TaskSection>
            )}
          </>
        )}

      </main>

      {/* Modals */}
      {user && (
        <CharacterPanel
          user={user}
          open={showCharacter}
          onClose={() => setShowCharacter(false)}
          onLogout={handleLogout}
          onLoginClick={() => setShowAuthModal(true)}
          achievements={achievements}
          onOpenAchievements={() => { setShowCharacter(false); setShowAchievements(true) }}
          onViewAchievementDetail={(id) => { setAchievementDetailId(id); setShowAchievementDetail(true) }}
        />
      )}

      <CreateTaskModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onAdd={handleAddTask}
      />

      <AuthModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />

      <LevelUpModal
        show={showLevelUp}
        newLevel={newLevel}
        onClose={() => setShowLevelUp(false)}
      />

      {/* Gacha modals */}
      {user && (
        <GachaModal
          open={showGacha}
          onClose={() => setShowGacha(false)}
          coins={user.coins}
          coupons={gachaCoupons}
          spinning={gachaSpinning}
          onSpin={handleGachaSpin}
          onOpenCodex={() => { setShowGacha(false); setShowCodex(true) }}
        />
      )}

      <GachaResultModal
        open={showGachaResult}
        result={gachaResult}
        couponsAfter={gachaCoupons}
        onClose={handleGachaResultClose}
      />

      <CodexModal
        open={showCodex}
        collection={gachaCollection}
        onClose={() => setShowCodex(false)}
        onViewItem={handleCodexViewItem}
      />

      <CodexItemDetail
        open={showCodexDetail}
        item={codexDetailItem}
        count={codexDetailCount}
        onClose={() => setShowCodexDetail(false)}
      />

      {/* Achievement modals */}
      <AchievementModal
        open={showAchievements}
        unlocked={achievements}
        onClose={() => setShowAchievements(false)}
        onViewDetail={(id) => { setAchievementDetailId(id); setShowAchievementDetail(true) }}
      />

      <AchievementDetailModal
        open={showAchievementDetail}
        achievementId={achievementDetailId}
        unlocked={achievements}
        onClose={() => setShowAchievementDetail(false)}
      />

      <AchievementToast
        achievement={achievementToast}
        onClose={clearAchievementToast}
        onClick={() => {
          if (achievementToast) {
            setAchievementDetailId(achievementToast.id)
            setShowAchievementDetail(true)
            setAchievementToast(null)
          }
        }}
      />
    </div>
  )
}

export default GameApp
