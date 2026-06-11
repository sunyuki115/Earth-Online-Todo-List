"use client"

import { motion, AnimatePresence } from "framer-motion"
import { type UserInfo } from "@/types"
import {
  ACHIEVEMENTS, getSortedAchievements,
  type UnlockedAchievement,
} from "@/lib/achievements"

export function CharacterPanel({
  user,
  open,
  onClose,
  onLogout,
  onLoginClick,
  achievements,
  onOpenAchievements,
  onViewAchievementDetail,
}: {
  user: UserInfo
  open: boolean
  onClose: () => void
  onLogout: () => void
  onLoginClick: () => void
  achievements: UnlockedAchievement[]
  onOpenAchievements: () => void
  onViewAchievementDetail: (id: string) => void
}) {
  const xpPercent = Math.floor((user.xp / user.xpToNextLevel) * 100)
  const displaySurvivalDays = user.isGuest ? 0 : user.survivalDays

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-40"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-sm z-50 overflow-y-auto custom-scrollbar"
            style={{ backgroundColor: "#F9F3E6" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5">
              {/* Close button */}
              <button
                onClick={onClose}
                className="pixel-btn bg-earth-red text-white pixel-font text-xs px-3 py-2 mb-6"
              >
                ✕ 关闭
              </button>

              {/* Guest Notice */}
              {user.isGuest && (
                <div className="pixel-border-thin p-3 bg-earth-gold/15 mb-4">
                  <p className="pixel-font text-[10px] text-earth-brown mb-2">
                    👻 你当前是游客模式
                  </p>
                  <p className="text-[9px] text-earth-text-light leading-relaxed">
                    游客数据仅保存在本浏览器，清除缓存或换设备会丢失！点击下方按钮注册账号，数据将永久保存。
                  </p>
                </div>
              )}

              {/* Character Card */}
              <div className="pixel-card p-5 mb-4">
                <h2 className="pixel-font text-sm text-earth-brown mb-4 text-center">
                  🧑 冒险者档案
                </h2>

                {/* Avatar + Name */}
                <div className="flex items-center gap-4 mb-5">
                  <div className="pixel-avatar w-20 h-20 bg-earth-gold/20 flex items-center justify-center text-4xl flex-shrink-0">
                    👤
                  </div>
                  <div className="min-w-0">
                    <h3 className="pixel-font text-sm text-earth-text truncate">{user.name}</h3>
                    <p className="mt-1">
                      <span className="pixel-font text-[10px] text-earth-brown">Lv.{user.level}</span>
                      {" "}
                      <span className="cn-font text-xs text-earth-brown">{user.levelTitle}</span>
                    </p>
                    {user.email && (
                      <p className="text-[10px] text-earth-text-light mt-1 truncate">{user.email}</p>
                    )}
                  </div>
                </div>

                {/* XP Bar */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="pixel-font text-[10px] text-earth-text-light">经验值</span>
                    <span className="pixel-font text-[10px] text-earth-green">
                      {user.xp}/{user.xpToNextLevel} XP
                    </span>
                  </div>
                  <div className="xp-bar-track">
                    <div className="xp-bar-fill" style={{ width: `${xpPercent}%` }} />
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="pixel-border-thin p-3 bg-earth-cream text-center">
                    <div className="text-lg mb-1">💰</div>
                    <div className="pixel-font text-[10px] text-earth-text-light">金币</div>
                    <div className="pixel-font text-sm text-earth-gold mt-1">{user.coins}</div>
                  </div>
                  <div className="pixel-border-thin p-3 bg-earth-cream text-center">
                    <div className="text-lg mb-1">📅</div>
                    <div className="pixel-font text-[10px] text-earth-text-light">生存天数</div>
                    <div className="pixel-font text-sm text-earth-brown mt-1">{displaySurvivalDays.toLocaleString()}</div>
                  </div>
                  <div className="pixel-border-thin p-3 bg-earth-cream text-center">
                    <div className="text-lg mb-1">✅</div>
                    <div className="pixel-font text-[10px] text-earth-text-light">已完成</div>
                    <div className="pixel-font text-sm text-earth-green mt-1">{user.completedTasks ?? 0}</div>
                  </div>
                </div>
              </div>

              {/* Achievements Entry */}
              <div className="pixel-card p-4 mb-4">
                <h3 className="pixel-font text-[10px] text-earth-brown mb-3">
                  🏆 成就 {achievements.length}/{ACHIEVEMENTS.length}
                </h3>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {(() => {
                    const sorted = getSortedAchievements(achievements)
                    const unlockedIds = new Set(achievements.map(a => a.id))
                    return sorted.slice(0, 3).map(def => {
                      const isUnlocked = unlockedIds.has(def.id)
                      return (
                        <button
                          key={def.id}
                          onClick={() => onViewAchievementDetail(def.id)}
                          className={`pixel-border-thin p-2 text-center transition-none ${
                            isUnlocked
                              ? "bg-earth-cream hover:border-earth-gold"
                              : "bg-gray-100 opacity-60"
                          }`}
                        >
                          <div className="text-lg mb-0.5">
                            {isUnlocked ? def.icon : "🔒"}
                          </div>
                          <div className="text-xs cn-font text-earth-text truncate">
                            {def.name}
                          </div>
                        </button>
                      )
                    })
                  })()}
                </div>
                <button
                  onClick={onOpenAchievements}
                  className="w-full py-2 pixel-btn bg-earth-cream text-earth-text-light pixel-font text-[10px]"
                >
                  查看全部
                </button>
              </div>

              {/* Logout */}
              {user.isGuest ? (
                <button
                  onClick={(e) => { e.stopPropagation(); onClose(); setTimeout(onLoginClick, 400) }}
                  className="w-full py-3 pixel-btn bg-[#C89B4E] text-white pixel-font text-xs"
                >
                  🎮 注册/登录保存数据
                </button>
              ) : (
                <button
                  onClick={onLogout}
                  className="w-full py-3 pixel-btn bg-earth-red text-white pixel-font text-xs"
                >
                  🚪 退出游戏
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
