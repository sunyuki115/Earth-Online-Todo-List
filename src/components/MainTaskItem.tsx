"use client"

import { useState, useEffect, useRef } from "react"
import { type TaskType } from "@/types"
import { TaskMenu } from "./TaskMenu"
import { ConfirmModal } from "./ConfirmModal"

export function MainTaskItem({
  task,
  onToggle,
  onEdit,
  onDelete,
  onToggleSubTask,
  onAddSubTask,
  onDeleteSubTask,
  onCheckIn,
  onCancelCheckIn,
  onRecordFocus,
}: {
  task: TaskType
  onToggle: (id: string, completed: boolean) => void
  onEdit: (id: string, title: string) => void
  onDelete: (id: string) => void
  onToggleSubTask: (taskId: string, subtaskId: string, completed: boolean) => void
  onAddSubTask: (taskId: string, title: string) => void
  onDeleteSubTask: (taskId: string, subtaskId: string) => void
  onCheckIn: (taskId: string) => void
  onCancelCheckIn: (taskId: string) => void
  onRecordFocus: (taskId: string, duration: number) => void
}) {
  const canExpand = !!task.completionMode
  const expandKey = `earth_online_task_${task.id}`
  const [expanded, setExpanded] = useState(() => {
    if (!canExpand || typeof window === "undefined") return false
    try {
      return localStorage.getItem(expandKey) === "true"
    } catch { return false }
  })
  const [justCompleted, setJustCompleted] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmComplete, setConfirmComplete] = useState(false)
  const [confirmGiveUp, setConfirmGiveUp] = useState(false)
  const [newSubTask, setNewSubTask] = useState("")
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })
  const [focusDuration, setFocusDuration] = useState(30)
  const [focusRemaining, setFocusRemaining] = useState<number | null>(null)
  const focusTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const focusDurationRef = useRef(30)

  const handleFocusStart = () => {
    focusDurationRef.current = focusDuration
    setFocusRemaining(focusDuration * 60)
    focusTimerRef.current = setInterval(() => {
      setFocusRemaining(prev => {
        if (prev === null || prev <= 1) {
          if (focusTimerRef.current) clearInterval(focusTimerRef.current)
          focusTimerRef.current = null
          onRecordFocus(task.id, focusDurationRef.current)
          return null
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleFocusGiveUp = () => {
    if (focusTimerRef.current) clearInterval(focusTimerRef.current)
    focusTimerRef.current = null
    setFocusRemaining(null)
  }

  useEffect(() => {
    return () => {
      if (focusTimerRef.current) clearInterval(focusTimerRef.current)
    }
  }, [])

  const toggleExpand = () => {
    if (!canExpand) return
    const next = !expanded
    setExpanded(next)
    try { localStorage.setItem(expandKey, String(next)) } catch {}
  }

  const handleToggle = () => {
    if (!task.completed && task.completionMode === "SUBTASK") {
      const incomplete = task.subTasks.filter(s => !s.completed).length
      if (incomplete > 0) {
        setConfirmComplete(true)
        return
      }
    }
    if (!task.completed) {
      setJustCompleted(true)
      setTimeout(() => setJustCompleted(false), 600)
    }
    onToggle(task.id, !task.completed)
  }

  const handleEditSubmit = () => {
    if (editTitle.trim() && editTitle.trim() !== task.title) {
      onEdit(task.id, editTitle.trim())
    }
    setEditing(false)
  }

  const modeIcon = task.completionMode === "SUBTASK" ? "📝"
    : task.completionMode === "CHECKIN" ? "📅"
    : task.completionMode === "FOCUS" ? "🍅"
    : null

  const modeText = task.completionMode === "SUBTASK" ? "子任务"
    : task.completionMode === "CHECKIN" ? "每日打卡"
    : task.completionMode === "FOCUS" ? "专注模式"
    : null

  const summaryText = task.completionMode === "SUBTASK"
    ? (() => {
        const done = task.subTasks.filter(s => s.completed).length
        return `已完成${done}/${task.subTasks.length}个子任务`
      })()
    : task.completionMode === "CHECKIN"
    ? `已打卡 ${task.checkIns.length} 天`
    : task.completionMode === "FOCUS"
    ? (() => {
        const totalMin = task.focusSessions.reduce((sum, s) => sum + s.duration, 0)
        const h = Math.floor(totalMin / 60)
        const m = totalMin % 60
        return h > 0 ? `已专注 ${h}h ${m}min` : `已专注 ${m}min`
      })()
    : null

  return (
    <>
      <div
        className={`pixel-border-thin ${
          task.completed ? "bg-[#DDD5C4]" : "bg-earth-cream"
        } ${justCompleted ? "task-complete-anim" : ""}`}
      >
        {/* Header row */}
        <div className="p-3 sm:p-4 flex items-center gap-2">
          {canExpand ? (
            <button
              onClick={toggleExpand}
              className="text-earth-text-light text-xs flex-shrink-0 w-4 text-center"
            >
              {expanded ? "▼" : "▶"}
            </button>
          ) : (
            <span className="w-4 flex-shrink-0" />
          )}
          <input
            type="checkbox"
            checked={task.completed}
            onChange={handleToggle}
            className="pixel-checkbox"
          />
          {editing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleEditSubmit}
              onKeyDown={(e) => { if (e.key === "Enter") handleEditSubmit(); if (e.key === "Escape") setEditing(false) }}
              className="flex-1 px-2 py-1 pixel-input text-sm min-w-0"
              autoFocus
            />
          ) : (
            <span
              className={`flex-1 text-xs sm:text-sm min-w-0 truncate ${
                task.completed ? "line-through text-earth-text-light" : "text-earth-text"
              } ${canExpand ? "cursor-pointer" : ""}`}
              onClick={canExpand ? toggleExpand : undefined}
            >
              {task.title}
            </span>
          )}
          {modeIcon && modeText && (
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap flex-shrink-0">
              <span className="text-xs leading-none">{modeIcon}</span>
              <span className="pixel-font text-[9px] sm:text-[10px] text-earth-text-light">{modeText}</span>
            </span>
          )}
          <TaskMenu
            task={task}
            onEdit={() => { setEditTitle(task.title); setEditing(true) }}
            onDelete={() => setConfirmDelete(true)}
          />
        </div>

        {/* Summary line */}
        {summaryText && !expanded && (
          <div
            className="px-3 sm:px-4 pb-3 pl-[52px] sm:pl-[60px] cursor-pointer"
            onClick={toggleExpand}
          >
            <span className="text-[11px] text-earth-text-light cn-font">{summaryText}</span>
          </div>
        )}

        {/* Expanded content */}
        {expanded && canExpand && (
          <div className="px-3 sm:px-4 pb-4 pl-[52px] sm:pl-[60px]">
            {task.completionMode === "SUBTASK" && (
              <div className="pixel-border-thin p-3 bg-earth-cream/50">
                {task.subTasks.length > 0 && (
                  <div className={`space-y-1.5 ${!task.completed ? "mb-3" : ""}`}>
                    {task.subTasks.map((st) => (
                      <div key={st.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={st.completed}
                          onChange={() => onToggleSubTask(task.id, st.id, !st.completed)}
                          disabled={task.completed}
                          className={`pixel-checkbox ${task.completed ? "opacity-40" : ""}`}
                        />
                        <span className={`flex-1 text-xs min-w-0 truncate ${
                          st.completed ? "line-through text-earth-text-light" : "text-earth-text"
                        }`}>
                          {st.title}
                        </span>
                        {!task.completed && (
                          <button
                            onClick={() => onDeleteSubTask(task.id, st.id)}
                            className="text-earth-text-light hover:text-earth-red text-xs flex-shrink-0"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {!task.completed && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSubTask}
                      onChange={(e) => setNewSubTask(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newSubTask.trim()) {
                          onAddSubTask(task.id, newSubTask.trim())
                          setNewSubTask("")
                        }
                      }}
                      placeholder="添加子任务..."
                      className="flex-1 px-2 py-1.5 pixel-input text-xs min-w-0"
                    />
                    <button
                      onClick={() => {
                        if (newSubTask.trim()) {
                          onAddSubTask(task.id, newSubTask.trim())
                          setNewSubTask("")
                        }
                      }}
                      className="pixel-btn text-[10px] px-3 py-1.5 flex-shrink-0"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            )}
            {task.completionMode === "CHECKIN" && (() => {
              const today = new Date().toISOString().split("T")[0]
              const checkedToday = task.checkIns.includes(today)
              const { year, month } = calendarMonth
              const firstDay = new Date(year, month, 1).getDay()
              const daysInMonth = new Date(year, month + 1, 0).getDate()
              const monthLabel = `${year} 年 ${month + 1} 月`
              const weekDays = ["日", "一", "二", "三", "四", "五", "六"]
              const cells: (number | null)[] = Array(firstDay).fill(null)
              for (let d = 1; d <= daysInMonth; d++) cells.push(d)
              while (cells.length % 7 !== 0) cells.push(null)

              const streak = (() => {
                const sorted = [...task.checkIns].sort().reverse()
                const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]
                if (sorted.length === 0 || (sorted[0] !== today && sorted[0] !== yesterday)) return 0
                let s = 1
                for (let i = 1; i < sorted.length; i++) {
                  const prev = new Date(sorted[i - 1])
                  const curr = new Date(sorted[i])
                  if ((prev.getTime() - curr.getTime()) / 86400000 === 1) s++
                  else break
                }
                return s
              })()

              return (
                <div className="pixel-border-thin p-3 bg-earth-cream/50">
                  <div className="flex items-center justify-between mb-2">
                    <button
                      onClick={() => setCalendarMonth(prev => {
                        const d = new Date(prev.year, prev.month - 1, 1)
                        return { year: d.getFullYear(), month: d.getMonth() }
                      })}
                      className="text-earth-text-light hover:text-earth-brown px-1 text-sm"
                    >
                      ◀
                    </button>
                    <span className="pixel-font text-[9px] text-earth-brown">{monthLabel}</span>
                    <button
                      onClick={() => setCalendarMonth(prev => {
                        const d = new Date(prev.year, prev.month + 1, 1)
                        return { year: d.getFullYear(), month: d.getMonth() }
                      })}
                      className="text-earth-text-light hover:text-earth-brown px-1 text-sm"
                    >
                      ▶
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-0.5 mb-2">
                    {weekDays.map(d => (
                      <div key={d} className="text-center pixel-font text-[8px] text-earth-text-light py-0.5">{d}</div>
                    ))}
                    {cells.map((day, i) => {
                      if (day === null) return <div key={`e${i}`} />
                      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                      const isChecked = task.checkIns.includes(dateStr)
                      const isToday = dateStr === today
                      return (
                        <div
                          key={dateStr}
                          className={`text-center text-[10px] py-1 rounded-sm ${
                            isChecked ? "bg-earth-green/60 text-white" : "text-earth-text-light"
                          } ${isToday ? "ring-1 ring-earth-green" : ""}`}
                        >
                          {day}
                        </div>
                      )
                    })}
                  </div>
                  <p className={`text-xs cn-font text-earth-text-light ${!task.completed ? "mb-2" : ""}`}>
                    🔥 连续打卡 {streak} 天
                  </p>
                  {!task.completed && (
                    <button
                      onClick={() => checkedToday ? onCancelCheckIn(task.id) : onCheckIn(task.id)}
                      className={`w-full pixel-btn pixel-font text-[10px] py-2 ${
                        checkedToday
                          ? "bg-earth-text-light/30 text-earth-text-light"
                          : "bg-earth-green text-white"
                      }`}
                    >
                      {checkedToday ? "已打卡" : "今日打卡"}
                    </button>
                  )}
                </div>
              )
            })()}
            {task.completionMode === "FOCUS" && (() => {
              const totalMin = task.focusSessions.reduce((sum, s) => sum + s.duration, 0)
              const h = Math.floor(totalMin / 60)
              const m = totalMin % 60
              const totalLabel = h > 0 ? `${h}h ${m}min` : `${m}min`

              return (
                <div className="pixel-border-thin p-3 bg-earth-cream/50">
                  {focusRemaining !== null ? (
                    <>
                      <p className="text-xs cn-font text-earth-brown mb-3">🍅 专注中...</p>
                      <div className="text-center mb-3">
                        <div className="pixel-border-thin p-4 bg-earth-cream inline-block">
                          <span className="pixel-font text-2xl text-earth-brown">
                            {String(Math.floor(focusRemaining / 60)).padStart(2, "0")}:{String(focusRemaining % 60).padStart(2, "0")}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setConfirmGiveUp(true)}
                        className="w-full pixel-btn bg-earth-red/80 text-white pixel-font text-[10px] py-2"
                      >
                        ✖ 放弃
                      </button>
                    </>
                  ) : (
                    <>
                      <p className={`text-xs cn-font text-earth-text-light ${!task.completed ? "mb-3" : ""}`}>🍅 累计专注：{totalLabel}</p>
                      {!task.completed && (
                        <>
                          <div className="mb-2">
                            <div className="flex gap-2">
                              {[30, 45, 60].map(d => (
                                <button
                                  key={d}
                                  onClick={() => setFocusDuration(d)}
                                  className={`flex-1 py-1.5 pixel-btn pixel-font text-[9px] ${
                                    focusDuration === d ? "bg-earth-green text-white" : "bg-earth-cream text-earth-text-light"
                                  }`}
                                >
                                  {d}min
                                </button>
                              ))}
                            </div>
                          </div>
                          <button
                            onClick={handleFocusStart}
                            className="w-full pixel-btn bg-earth-green text-white pixel-font text-[10px] py-2"
                          >
                            ▶ 开始专注
                          </button>
                        </>
                      )}
                      {task.focusSessions.length > 0 && (
                        <div className="mt-3">
                          <p className="pixel-font text-[9px] text-earth-text-light mb-1.5">最近专注记录：</p>
                          <div className="space-y-0.5">
                            {task.focusSessions.slice(-5).reverse().map(s => {
                              const d = new Date(s.startedAt)
                              return (
                                <p key={s.id} className="text-[10px] text-earth-text-light">
                                  · {d.getMonth() + 1}/{d.getDate()} {s.duration}分钟
                                </p>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })()}
          </div>
        )}
      </div>
      <ConfirmModal
        open={confirmDelete}
        message="确定删除这个任务吗？"
        onConfirm={() => { setConfirmDelete(false); onDelete(task.id) }}
        onCancel={() => setConfirmDelete(false)}
      />
      <ConfirmModal
        open={confirmComplete}
        message={`还有 ${task.subTasks.filter(s => !s.completed).length} 个子任务未完成，确定完成吗？`}
        onConfirm={() => {
          setConfirmComplete(false)
          setJustCompleted(true)
          setTimeout(() => setJustCompleted(false), 600)
          onToggle(task.id, true)
        }}
        onCancel={() => setConfirmComplete(false)}
      />
      <ConfirmModal
        open={confirmGiveUp}
        message="放弃后本次专注不会记录，确认放弃吗？"
        onConfirm={() => {
          setConfirmGiveUp(false)
          handleFocusGiveUp()
        }}
        onCancel={() => setConfirmGiveUp(false)}
      />
    </>
  )
}
