"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

export function CreateTaskModal({
  open,
  onClose,
  onAdd,
}: {
  open: boolean
  onClose: () => void
  onAdd: (title: string, type: string, completionMode: string | null, initialSubTasks?: string[]) => void
}) {
  const [title, setTitle] = useState("")
  const [type, setType] = useState<"DAILY" | "MAIN">("DAILY")
  const [completionMode, setCompletionMode] = useState<string | null>(null)
  const [subTasks, setSubTasks] = useState<string[]>([])
  const [subTaskInput, setSubTaskInput] = useState("")

  const reset = () => {
    setTitle("")
    setType("DAILY")
    setCompletionMode(null)
    setSubTasks([])
    setSubTaskInput("")
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleSubmit = () => {
    if (!title.trim()) return
    onAdd(
      title.trim(),
      type,
      type === "MAIN" ? completionMode : null,
      completionMode === "SUBTASK" ? subTasks.filter(s => s.trim()) : undefined,
    )
    reset()
    onClose()
  }

  const addSubTask = () => {
    if (subTaskInput.trim()) {
      setSubTasks([...subTasks, subTaskInput.trim()])
      setSubTaskInput("")
    }
  }

  const removeSubTask = (index: number) => {
    setSubTasks(subTasks.filter((_, i) => i !== index))
  }

  const modeButtons: { key: string; label: string }[] = [
    { key: "SUBTASK", label: "📝 子任务" },
    { key: "CHECKIN", label: "📅 每日打卡" },
    { key: "FOCUS", label: "🍅 专注模式" },
  ]

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 z-50"
          />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-3 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md z-50 flex items-center justify-center"
            style={{ maxHeight: "90vh" }}
          >
            <div className="pixel-card p-5 sm:p-6 w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
              <h2 className="pixel-font text-xs text-earth-brown mb-5 text-center">
                ✦ 接取新任务
              </h2>

              {/* 任务名称 */}
              <div className="mb-4">
                <label className="pixel-font text-[10px] text-earth-brown block mb-1.5">
                  任务名称
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2.5 pixel-input text-sm"
                  placeholder="输入任务名称..."
                  autoFocus
                />
              </div>

              {/* 任务类型 */}
              <div className="mb-4">
                <label className="pixel-font text-[10px] text-earth-brown block mb-1.5">
                  任务类型
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setType("DAILY"); setCompletionMode(null); setSubTasks([]) }}
                    className={`flex-1 py-2.5 pixel-font text-xs pixel-btn ${
                      type === "DAILY"
                        ? "bg-earth-green text-white"
                        : "bg-earth-cream text-earth-text-light"
                    }`}
                  >
                    📋 日常任务
                  </button>
                  <button
                    onClick={() => setType("MAIN")}
                    className={`flex-1 py-2.5 pixel-font text-xs pixel-btn ${
                      type === "MAIN"
                        ? "bg-earth-green text-white"
                        : "bg-earth-cream text-earth-text-light"
                    }`}
                  >
                    ⚔️ 主线任务
                  </button>
                </div>
              </div>

              {/* 完成模式（仅主线任务） */}
              {type === "MAIN" && (
                <div className="mb-4">
                  <label className="pixel-font text-[10px] text-earth-brown block mb-1.5">
                    完成模式<span className="text-earth-text-light">（可选）</span>
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {modeButtons.map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => setCompletionMode(completionMode === key ? null : key)}
                        className={`py-2 px-3 pixel-font text-xs pixel-btn ${
                          completionMode === key
                            ? "bg-earth-green text-white"
                            : "bg-earth-cream text-earth-text-light"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 子任务列表（选了子任务模式后显示） */}
              {type === "MAIN" && completionMode === "SUBTASK" && (
                <div className="mb-4">
                  <label className="pixel-font text-[10px] text-earth-brown block mb-1.5">
                    子任务
                  </label>
                  {subTasks.length > 0 && (
                    <div className="space-y-1.5 mb-2">
                      {subTasks.map((st, i) => (
                        <div key={i} className="flex items-center gap-2 pixel-border-thin p-2 bg-earth-cream">
                          <span className="text-xs text-earth-text flex-1 truncate">{st}</span>
                          <button
                            onClick={() => removeSubTask(i)}
                            className="text-earth-red/50 hover:text-earth-red text-sm"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={subTaskInput}
                      onChange={(e) => setSubTaskInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSubTask() } }}
                      className="flex-1 px-2 py-2 pixel-input text-xs"
                      placeholder="输入子任务..."
                    />
                    <button
                      onClick={addSubTask}
                      disabled={!subTaskInput.trim()}
                      className="pixel-btn bg-earth-cream text-earth-text pixel-font text-xs px-3 py-2
                        disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      + 添加
                    </button>
                  </div>
                </div>
              )}

              {/* 底部按钮 */}
              <div className="flex gap-3 mt-5">
                <button
                  onClick={handleClose}
                  className="flex-1 py-3 pixel-btn bg-earth-cream text-earth-text pixel-font text-xs"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!title.trim()}
                  className="flex-1 py-3 pixel-btn bg-earth-green text-white pixel-font text-xs
                    disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  确认接取
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
