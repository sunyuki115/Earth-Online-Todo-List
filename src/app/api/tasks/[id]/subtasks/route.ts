import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { REWARDS, getLevelTitle, xpForLevel, applyReward } from "@/lib/rewards"

// POST /api/tasks/[id]/subtasks - Add a subtask
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { title } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: "子任务标题不能为空" }, { status: 400 })
    }

    const task = await db.task.findUnique({ where: { id } })
    if (!task || task.userId !== session.user.id) {
      return NextResponse.json({ error: "任务不存在" }, { status: 404 })
    }
    if (task.completionMode !== "SUBTASK") {
      return NextResponse.json({ error: "该任务不支持子任务" }, { status: 400 })
    }

    const subTask = await db.subTask.create({
      data: { taskId: id, title: title.trim() },
    })

    return NextResponse.json(subTask, { status: 201 })
  } catch (error) {
    console.error("Create subtask error:", error)
    return NextResponse.json({ error: "创建子任务失败" }, { status: 500 })
  }
}

// PUT /api/tasks/[id]/subtasks - Toggle a subtask
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { subtaskId, completed } = body

    const task = await db.task.findUnique({ where: { id } })
    if (!task || task.userId !== session.user.id) {
      return NextResponse.json({ error: "任务不存在" }, { status: 404 })
    }

    const subTask = await db.subTask.findUnique({ where: { id: subtaskId } })
    if (!subTask || subTask.taskId !== id) {
      return NextResponse.json({ error: "子任务不存在" }, { status: 404 })
    }

    let leveledUp = false
    let newLevel = 0

    if (completed && !subTask.completed) {
      const user = await db.user.findUnique({ where: { id: session.user.id } })
      if (user) {
        const result = applyReward(user, REWARDS.SUBTASK_COMPLETE)
        leveledUp = result.leveledUp
        newLevel = result.newLevel
        await db.user.update({
          where: { id: session.user.id },
          data: { xp: result.xp, level: result.level, coins: result.coins },
        })
      }
    }

    if (!completed && subTask.completed) {
      const user = await db.user.findUnique({ where: { id: session.user.id } })
      if (user) {
        await db.user.update({
          where: { id: session.user.id },
          data: {
            xp: Math.max(0, user.xp - REWARDS.SUBTASK_COMPLETE.xp),
            coins: Math.max(0, user.coins - REWARDS.SUBTASK_COMPLETE.coins),
          },
        })
      }
    }

    const updatedSubTask = await db.subTask.update({
      where: { id: subtaskId },
      data: { completed, completedAt: completed ? new Date() : null },
    })

    const updatedUser = await db.user.findUnique({ where: { id: session.user.id } })

    return NextResponse.json({
      subTask: updatedSubTask,
      user: updatedUser ? {
        level: updatedUser.level,
        xp: updatedUser.xp,
        coins: updatedUser.coins,
        levelTitle: getLevelTitle(updatedUser.level),
        xpToNextLevel: xpForLevel(updatedUser.level),
      } : null,
      leveledUp,
      newLevel,
    })
  } catch (error) {
    console.error("Toggle subtask error:", error)
    return NextResponse.json({ error: "更新子任务失败" }, { status: 500 })
  }
}

// DELETE /api/tasks/[id]/subtasks - Delete a subtask
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { subtaskId } = body

    const task = await db.task.findUnique({ where: { id } })
    if (!task || task.userId !== session.user.id) {
      return NextResponse.json({ error: "任务不存在" }, { status: 404 })
    }

    const subTask = await db.subTask.findUnique({ where: { id: subtaskId } })
    if (!subTask || subTask.taskId !== id) {
      return NextResponse.json({ error: "子任务不存在" }, { status: 404 })
    }

    await db.subTask.delete({ where: { id: subtaskId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete subtask error:", error)
    return NextResponse.json({ error: "删除子任务失败" }, { status: 500 })
  }
}
