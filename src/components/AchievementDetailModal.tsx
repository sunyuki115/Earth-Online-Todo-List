"use client"

import { motion, AnimatePresence } from "framer-motion"
import {
  getAchievementById, getStarDisplay, getNextTierCondition,
  type UnlockedAchievement,
} from "@/lib/achievements"

export function AchievementDetailModal({
  open,
  achievementId,
  unlocked,
  onClose,
}: {
  open: boolean
  achievementId: string | null
  unlocked: UnlockedAchievement[]
  onClose: () => void
}) {
  if (!achievementId) return null
  const def = getAchievementById(achievementId)
  if (!def) return null

  const unlockedEntry = unlocked.find(a => a.id === achievementId)
  const isUnlocked = !!unlockedEntry
  const currentStar = unlockedEntry?.star ?? 0
  const nextCondition = getNextTierCondition(def, currentStar)

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 z-[60]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] w-full max-w-xs px-4"
          >
            <div className="pixel-card p-5 text-center">
              <div className={`pixel-border-thin p-5 bg-earth-cream mb-4 ${
                isUnlocked ? "border-earth-gold" : "border-earth-text-light/40"
              }`}>
                <div className="text-4xl mb-3">
                  {isUnlocked ? def.icon : "🔒"}
                </div>
                <div className="cn-font text-sm font-bold text-earth-text mb-2">
                  {def.name}
                </div>

                {isUnlocked && def.tiers && currentStar > 0 && (
                  <div className="pixel-font text-lg text-earth-gold mb-2 tracking-widest">
                    {getStarDisplay(currentStar)}
                  </div>
                )}

                <div className="text-[10px] cn-font text-earth-text-light mb-2">
                  解锁条件：{def.condition}
                  {def.tiers && (
                    <span> ({def.tiers.map(t =>
                      `${getStarDisplay(t.star)} ${t.threshold}`
                    ).join(" / ")})</span>
                  )}
                </div>

                {isUnlocked && (
                  <div className="cn-font text-xs text-earth-text-light/80 italic mt-2">
                    {def.desc}
                  </div>
                )}
              </div>

              {isUnlocked && (
                <p className="text-[10px] cn-font text-earth-green mb-2">
                  ✅ 已解锁 {unlockedEntry.unlockedAt.split("T")[0].replace(/-/g, "/")}
                </p>
              )}

              {isUnlocked && nextCondition && (
                <p className="text-[10px] cn-font text-earth-text-light mb-2">
                  下一级：{nextCondition}
                </p>
              )}

              {!isUnlocked && (
                <p className="text-[10px] cn-font text-earth-text-light mb-2">
                  🔒 未解锁
                </p>
              )}

              <button
                onClick={onClose}
                className="w-full py-2.5 pixel-btn bg-earth-cream text-earth-text pixel-font text-xs"
              >
                关闭
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
