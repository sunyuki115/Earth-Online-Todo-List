"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { type TaskType } from "@/types"

export function TaskMenuPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null
  return createPortal(children, document.body)
}

export function TaskMenu({
  task,
  onEdit,
  onDelete,
}: {
  task: TaskType
  onEdit: () => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(true) }}
        className="flex-shrink-0 text-earth-text-light hover:text-earth-brown p-1 text-sm leading-none"
        title="更多操作"
      >
        ···
      </button>
      <TaskMenuPortal>
        <AnimatePresence>
          {open && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
              <motion.div
                className="relative pixel-card p-0 w-full max-w-[200px]"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <div className="px-4 py-3 text-center">
                  <p className="text-xs cn-font text-earth-text-light truncate">{task.title}</p>
                </div>
                <div className="pixel-border-thin mx-2" />
                <button
                  onClick={() => { setOpen(false); onEdit() }}
                  className="w-full text-left px-4 py-3 text-sm cn-font text-earth-text hover:bg-earth-cream/80"
                >
                  ✏️ 编辑
                </button>
                <button
                  onClick={() => { setOpen(false); onDelete() }}
                  className="w-full text-left px-4 py-3 text-sm cn-font text-earth-red hover:bg-earth-red/10"
                >
                  🗑️ 删除
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="w-full text-center px-4 py-3 text-xs cn-font text-earth-text-light hover:bg-earth-cream/80"
                >
                  取消
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </TaskMenuPortal>
    </>
  )
}
