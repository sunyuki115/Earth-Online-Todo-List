"use client"

import { motion, AnimatePresence } from "framer-motion"
import { TaskMenuPortal } from "./TaskMenu"

export function ConfirmModal({
  open,
  message,
  onConfirm,
  onCancel,
}: {
  open: boolean
  message: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <TaskMenuPortal>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCancel}
              className="fixed inset-0 bg-black/50 z-[60]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.12 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] w-full max-w-xs"
            >
              <div className="pixel-card p-5 text-center">
                <p className="text-sm text-earth-text mb-5 cn-font">{message}</p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={onCancel}
                    className="pixel-btn bg-earth-cream text-earth-text pixel-font text-xs px-4 py-2"
                  >
                    取消
                  </button>
                  <button
                    onClick={onConfirm}
                    className="pixel-btn bg-earth-red text-white pixel-font text-xs px-4 py-2"
                  >
                    确定
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </TaskMenuPortal>
  )
}
