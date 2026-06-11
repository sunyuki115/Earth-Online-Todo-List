"use client"

import { motion, AnimatePresence } from "framer-motion"
import {
  getRarityStars, getCategoryLabel, splitDesc,
  type GachaItem,
} from "@/lib/gacha"

export function CodexItemDetail({
  open,
  item,
  count,
  onClose,
}: {
  open: boolean
  item: GachaItem | null
  count: number
  onClose: () => void
}) {
  if (!item) return null

  const { main: descMain, quote: descQuote } = splitDesc(item.desc)
  const borderClass = item.rarity === 3
    ? "border-earth-gold shadow-[0_0_12px_rgba(247,185,85,0.4)]"
    : item.rarity === 2
    ? "border-earth-green"
    : "border-earth-text-light/40"

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
              <div className={`pixel-border-thin p-5 bg-earth-cream border-4 ${borderClass} mb-4`}>
                <div className="text-4xl mb-3">{item.emoji}</div>
                <div className="cn-font text-sm font-bold text-earth-text mb-1">
                  「{item.name}」
                </div>
                <div className="text-[10px] cn-font text-earth-text-light mb-1">
                  {getCategoryLabel(item.category)}
                </div>
                {item.rarity > 0 && (
                  <div className="pixel-font text-lg text-earth-gold mb-3 tracking-widest">
                    {getRarityStars(item.rarity)}
                  </div>
                )}
                <div className="cn-font text-sm text-earth-text-light leading-relaxed text-left">
                  {descMain}
                </div>
                {descQuote && (
                  <div className="cn-font text-xs text-earth-text-light/60 mt-2 italic text-center">
                    「{descQuote}」
                  </div>
                )}
              </div>
              {count > 1 && (
                <p className="inline-flex items-center gap-1 text-earth-text-light mb-3">
                  <span className="cn-font text-xs">已获得</span>
                  <span className="pixel-font text-xs">×{count}</span>
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
