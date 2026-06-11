"use client"

import { motion, AnimatePresence } from "framer-motion"
import {
  ACHIEVEMENTS, getSortedAchievements,
  type UnlockedAchievement,
} from "@/lib/achievements"

export function AchievementModal({
  open,
  unlocked,
  onClose,
  onViewDetail,
}: {
  open: boolean
  unlocked: UnlockedAchievement[]
  onClose: () => void
  onViewDetail: (id: string) => void
}) {
  const sorted = getSortedAchievements(unlocked)
  const unlockedIds = new Set(unlocked.map(a => a.id))
  const unlockedCount = unlocked.length

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-50"
          />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-3 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md z-50 flex items-center justify-center"
            style={{ maxHeight: "90vh" }}
          >
            <div className="pixel-card p-4 sm:p-5 w-full max-h-[80vh] overflow-y-auto custom-scrollbar">
              <h2 className="pixel-font text-xs text-earth-gold mb-4 text-center">
                🏆 成就 ({unlockedCount}/{ACHIEVEMENTS.length})
              </h2>

              <div className="grid grid-cols-4 gap-2">
                {sorted.map(def => {
                  const isUnlocked = unlockedIds.has(def.id)
                  const unlockedEntry = unlocked.find(a => a.id === def.id)
                  return (
                    <button
                      key={def.id}
                      onClick={() => onViewDetail(def.id)}
                      className={`pixel-border-thin p-2.5 text-center transition-none ${
                        isUnlocked
                          ? "bg-earth-cream hover:border-earth-gold"
                          : "bg-gray-100 opacity-60"
                      }`}
                    >
                      <div className="text-xl mb-1">
                        {isUnlocked ? def.icon : "🔒"}
                      </div>
                      <div className="text-[9px] cn-font text-earth-text truncate">
                        {def.name}
                      </div>
                    </button>
                  )
                })}
              </div>

              <button
                onClick={onClose}
                className="w-full mt-4 py-2.5 pixel-btn bg-earth-cream text-earth-text-light pixel-font text-xs"
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
