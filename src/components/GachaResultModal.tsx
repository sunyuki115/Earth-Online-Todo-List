"use client"

import { motion, AnimatePresence } from "framer-motion"
import {
  COUPONS_FOR_FREE,
  getRarityStars, splitDesc,
  type GachaResult,
} from "@/lib/gacha"

export function GachaResultModal({
  open,
  result,
  couponsAfter,
  onClose,
}: {
  open: boolean
  result: GachaResult | null
  couponsAfter: number
  onClose: () => void
}) {
  const renderContent = () => {
    if (!result) return null
    const { item, reward, isCoupon } = result
    const { main: descMain, quote: descQuote } = splitDesc(item.desc)
    const borderClass = item.rarity === 3
      ? "border-earth-gold shadow-[0_0_12px_rgba(247,185,85,0.4)]"
      : item.rarity === 2
      ? "border-earth-green"
      : "border-earth-text-light/40"

    let rewardText = ""
    if (item.category === "food") rewardText = `+${reward.xp} XP`
    else if (item.category === "equip") rewardText = `+${reward.coins} 💰`
    else if (isCoupon) rewardText = "🎫 优惠券 +1"

    return (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/70 z-[60]"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2, type: "spring", damping: 15 }}
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] w-full max-w-xs px-4"
        >
          <div className="pixel-card p-5 sm:p-6 text-center">
            <p className="pixel-font text-xs text-earth-gold mb-4">✨ 恭喜获得！</p>

            {/* Item card */}
            <div className={`pixel-border-thin p-5 bg-earth-cream border-4 ${borderClass} mb-4`}>
              <div className="text-4xl mb-3">{item.emoji}</div>
              <div className="cn-font text-sm font-bold text-earth-text mb-1">
                「{item.name}」
              </div>
              {item.rarity > 0 && (
                <div className="pixel-font text-lg text-earth-gold mb-3 tracking-widest">
                  {getRarityStars(item.rarity)}
                </div>
              )}
              <div className="cn-font text-xs text-earth-text-light leading-relaxed text-left">
                {descMain}
              </div>
              {descQuote && (
                <div className="cn-font text-xs text-earth-text-light/60 mt-2 italic text-center">
                  「{descQuote}」
                </div>
              )}
            </div>

            {/* Reward */}
            {rewardText && (
              <div className="pixel-font text-[10px] text-earth-green mb-3">{rewardText}</div>
            )}

            {/* Coupon progress hint */}
            {isCoupon && (
              <div className="pixel-border-thin p-2 bg-earth-cream mb-4">
                <div className="flex items-center justify-center gap-2">
                  <div className="flex gap-1">
                    {Array.from({ length: COUPONS_FOR_FREE }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-2.5 h-2.5 rounded-sm border ${
                          i < couponsAfter
                            ? "bg-earth-gold border-earth-gold-dark"
                            : "bg-earth-cream border-earth-text-light/30"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[9px] cn-font text-earth-text-light">
                    {couponsAfter >= COUPONS_FOR_FREE
                      ? "集满了！下次扭蛋免费 ✨"
                      : `${couponsAfter}/${COUPONS_FOR_FREE} 集齐可免费扭蛋`}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full py-3 pixel-btn bg-earth-green text-white pixel-font text-xs"
            >
              收下！
            </button>
          </div>
        </motion.div>
      </>
    )
  }

  return (
    <AnimatePresence>
      {open && renderContent()}
    </AnimatePresence>
  )
}
