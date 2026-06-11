"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { getAchievementById, getStarDisplay } from "@/lib/achievements"

export function AchievementToast({
  achievement,
  onClose,
  onClick,
}: {
  achievement: { id: string; star: number } | null
  onClose: () => void
  onClick: () => void
}) {
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (achievement) {
      setVisible(true)
      timerRef.current = setTimeout(() => {
        setVisible(false)
        setTimeout(onClose, 300)
      }, 4000)
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [achievement, onClose])

  if (!achievement) return null
  const def = getAchievementById(achievement.id)
  if (!def) return null

  const isUpgrade = def.tiers && achievement.star > 0
  const label = isUpgrade
    ? `成就升级：${def.name} ${getStarDisplay(achievement.star)}`
    : `成就解锁：${def.name}`

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] cursor-pointer"
          onClick={onClick}
        >
          <div className="pixel-card px-5 py-3 bg-earth-gold/95 flex items-center gap-3 shadow-lg"
            style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
            <span className="text-xl">{def.icon}</span>
            <span className="pixel-font text-[10px] text-earth-text whitespace-nowrap">
              🏆 {label}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
