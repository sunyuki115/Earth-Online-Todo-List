"use client"

import { motion, AnimatePresence } from "framer-motion"
import { GACHA_COST, COUPONS_FOR_FREE } from "@/lib/gacha"

export function GachaModal({
  open,
  onClose,
  coins,
  coupons,
  spinning,
  onSpin,
  onOpenCodex,
}: {
  open: boolean
  onClose: () => void
  coins: number
  coupons: number
  spinning: boolean
  onSpin: (useFree: boolean) => void
  onOpenCodex: () => void
}) {
  const canAfford = coins >= GACHA_COST
  const hasFree = coupons >= COUPONS_FOR_FREE

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={spinning ? undefined : onClose}
            className="fixed inset-0 bg-black/60 z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={spinning
              ? { opacity: 1, scale: 1, rotate: [0, -3, 3, -4, 4, -3, 3, -2, 2, 0], x: [0, -2, 2, -3, 3, -2, 2, -1, 1, 0] }
              : { opacity: 1, scale: 1, rotate: 0, x: 0 }
            }
            exit={{ opacity: 0, scale: 0.9 }}
            transition={spinning
              ? { duration: 0.4, repeat: 4, ease: "easeInOut" }
              : { duration: 0.15 }
            }
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md px-4"
          >
            <div className="pixel-card p-6 sm:p-8 text-center">
              <h2 className="pixel-font text-xs text-earth-gold mb-5">
                {spinning ? "🎰 扭蛋中..." : "🎰 扭蛋机"}
              </h2>

              {/* TODO: 替换为透明背景 PNG 图片 */}
              <img
                src="/gacha-machine.png"
                alt="扭蛋机"
                className="w-32 h-auto mx-auto mb-4 mix-blend-multiply"
                draggable={false}
              />

              {/* Coins display */}
              <div className="mb-3">
                <span className="text-sm cn-font text-earth-text">💰 当前金币：</span>
                <span className="pixel-font text-sm text-earth-gold">{coins}</span>
              </div>

              {/* Coupon progress - always visible */}
              <div className="mb-3 pixel-border-thin p-2 bg-earth-cream">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xs cn-font text-earth-text-light">
                    🎫 优惠券：{coupons}/{COUPONS_FOR_FREE}
                  </span>
                  {/* Visual progress dots */}
                  <div className="flex gap-1">
                    {Array.from({ length: COUPONS_FOR_FREE }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-3 h-3 rounded-sm border ${
                          i < coupons
                            ? "bg-earth-gold border-earth-gold-dark"
                            : "bg-earth-cream border-earth-text-light/30"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-[9px] cn-font text-earth-text-light/70 mt-1">
                  {hasFree ? "✨ 集满了！本次扭蛋免费" : "集齐3张优惠券可免费扭蛋一次"}
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-3 mt-4">
                {hasFree ? (
                  <button
                    onClick={() => onSpin(true)}
                    disabled={spinning}
                    className="w-full py-3 pixel-btn bg-earth-green text-white pixel-font text-xs
                      disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {spinning ? "扭蛋中..." : "🎫 免费扭一次！"}
                  </button>
                ) : (
                  <button
                    onClick={() => onSpin(false)}
                    disabled={!canAfford || spinning}
                    className="w-full py-3 pixel-btn bg-earth-gold text-earth-text pixel-font text-xs
                      disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center"
                  >
                    {spinning ? "扭蛋中..." : <><span>扭一次 - {GACHA_COST}</span>{" "}<span className="text-sm leading-none">💰</span></>}
                  </button>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={onOpenCodex}
                    disabled={spinning}
                    className="flex-1 py-2.5 pixel-btn bg-earth-cream text-earth-text pixel-font text-xs
                      disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    📖 图鉴
                  </button>
                  <button
                    onClick={onClose}
                    disabled={spinning}
                    className="flex-1 py-2.5 pixel-btn bg-earth-cream text-earth-text-light pixel-font text-xs
                      disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
