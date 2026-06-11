"use client"

import { motion, AnimatePresence } from "framer-motion"
import { getLevelTitle } from "@/lib/rewards"

export function LevelUpModal({
  show,
  newLevel,
  onClose,
}: {
  show: boolean
  newLevel: number
  onClose: () => void
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="pixel-card p-6 sm:p-8 max-w-sm w-full text-center level-up-anim"
          >
            <div className="text-4xl mb-3">
              ⭐✨⭐
            </div>
            <h2 className="pixel-font text-base text-earth-gold mb-2">升级了！</h2>
            <p className="pixel-font text-2xl text-earth-brown mb-2">Lv.{newLevel}</p>
            <p className="pixel-font text-xs text-earth-green mb-4">{getLevelTitle(newLevel)}</p>
            <div className="pixel-border-thin p-3 bg-earth-cream mb-4">
              <p className="text-xs text-earth-text-light">
                升级奖励：<span className="text-earth-gold font-bold">+{newLevel * 10} 💰</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="pixel-btn bg-earth-green text-white pixel-font text-xs px-6 py-3"
            >
              继续冒险！
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
