"use client"

import { useState } from "react"
import { type TaskType } from "@/types"
import { TaskMenu } from "./TaskMenu"
import { ConfirmModal } from "./ConfirmModal"

export function DailyTaskItem({
  task,
  onToggle,
  onEdit,
  onDelete,
}: {
  task: TaskType
  onToggle: (id: string, completed: boolean) => void
  onEdit: (id: string, title: string) => void
  onDelete: (id: string) => void
}) {
  const [justCompleted, setJustCompleted] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleToggle = () => {
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

  return (
    <>
      <div
        className={`pixel-border-thin p-3 sm:p-4 flex items-center gap-3 ${
          task.completed ? "bg-[#DDD5C4]" : "bg-earth-cream"
        } ${justCompleted ? "task-complete-anim" : ""}`}
      >
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
          <span className={`flex-1 text-xs sm:text-sm min-w-0 truncate ${
            task.completed ? "line-through text-earth-text-light" : "text-earth-text"
          }`}>
            {task.title}
          </span>
        )}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[8px] sm:text-[9px] text-earth-green pixel-font whitespace-nowrap">
            +{task.xpReward}XP
          </span>
          <span className="text-[8px] sm:text-[9px] text-earth-gold pixel-font whitespace-nowrap inline-flex items-center gap-px">
            +{task.coinReward} <span className="text-[10px] leading-none relative top-[-2px] left-[1px]">💰</span>
          </span>
        </div>
        <TaskMenu
          task={task}
          onEdit={() => { setEditTitle(task.title); setEditing(true) }}
          onDelete={() => setConfirmDelete(true)}
        />
      </div>
      <ConfirmModal
        open={confirmDelete}
        message="确定删除这个任务吗？"
        onConfirm={() => { setConfirmDelete(false); onDelete(task.id) }}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  )
}
