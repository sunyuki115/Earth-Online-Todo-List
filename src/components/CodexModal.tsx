"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  getItemById, getRarityStars,
  type GachaItem, type CollectionEntry,
} from "@/lib/gacha"

export function CodexModal({
  open,
  collection,
  onClose,
  onViewItem,
}: {
  open: boolean
  collection: CollectionEntry[]
  onClose: () => void
  onViewItem: (item: GachaItem, count: number) => void
}) {
  const [activeTab, setActiveTab] = useState<GachaItem["category"]>("food")
  const categories: { key: GachaItem["category"]; label: string }[] = [
    { key: "food", label: "🍜 食物" },
    { key: "equip", label: "⚔️ 装备" },
    { key: "coupon", label: "🎫 券" },
    { key: "lore", label: "📜 见闻" },
  ]

  const filteredItems = collection
    .map(e => ({ entry: e, item: getItemById(e.itemId) }))
    .filter(x => x.item && x.item.category === activeTab) as { entry: CollectionEntry; item: GachaItem }[]

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
            className="fixed inset-3 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-lg z-50 flex items-center justify-center"
            style={{ maxHeight: "90vh" }}
          >
            <div className="pixel-card p-5 sm:p-6 w-full max-h-[80vh] overflow-y-auto custom-scrollbar">
              <h2 className="text-earth-gold mb-5 text-center">
                <span className="pixel-font text-xs">📖 Earth Online </span>
                <span className="cn-font text-base font-bold">图鉴</span>
              </h2>

              {/* Category tabs */}
              <div className="flex gap-0 mb-5">
                {categories.map(cat => (
                  <button
                    key={cat.key}
                    onClick={() => setActiveTab(cat.key)}
                    className={`flex-1 py-2.5 text-xs cn-font pixel-btn ${
                      activeTab === cat.key
                        ? "bg-earth-green text-white"
                        : "bg-earth-cream text-earth-text-light"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Grid */}
              {filteredItems.length === 0 ? (
                <div className="text-center py-10">
                  <div className="text-3xl mb-3">🔒</div>
                  <p className="text-sm cn-font text-earth-text-light">
                    还没有收集到这个品类的物品
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {filteredItems.map(({ entry, item }) => (
                    <button
                      key={item.id}
                      onClick={() => onViewItem(item, entry.count)}
                      className="pixel-border-thin p-4 bg-earth-cream text-center hover:border-earth-gold transition-none"
                    >
                      <div className="text-3xl mb-1.5">{item.emoji}</div>
                      <div className="text-xs cn-font text-earth-text truncate">{item.name}</div>
                      {item.rarity > 0 && (
                        <div className="text-[9px] text-earth-gold">{getRarityStars(item.rarity)}</div>
                      )}
                      {entry.count > 1 && (
                        <div className="pixel-font text-[8px] text-earth-text-light mt-0.5">×{entry.count}</div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Close */}
              <button
                onClick={onClose}
                className="w-full mt-5 py-3 pixel-btn bg-earth-cream text-earth-text-light pixel-font text-xs"
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
