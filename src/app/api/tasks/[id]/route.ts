import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { REWARDS, getLevelTitle, xpForLevel, applyReward } from "@/lib/rewards"

// PUT /api/tasks/[id] - Update a task (complete/uncomplete)
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
    const { completed, title } = body

    const task = await db.task.findUnique({
      where: { id },
    })

    if (!task || task.userId !== session.user.id) {
      return NextResponse.json({ error: "任务不存在" }, { status: 404 })
    }

    // Title-only update (edit task name)
    if (title !== undefined && completed === undefined) {
      const updatedTask = await db.task.update({
        where: { id },
        data: { title: title.trim() },
      })
      return NextResponse.json({ task: updatedTask })
    }

    let leveledUp = false
    let newLevel = 0

    if (completed && !task.completed) {
      const user = await db.user.findUnique({
        where: { id: session.user.id },
      })

      if (!user) {
        return NextResponse.json({ error: "用户不存在" }, { status: 404 })
      }

      const reward = task.type === "MAIN"
        ? REWARDS.MAIN_COMPLETE
        : REWARDS.DAILY_COMPLETE

      const result = applyReward(user, reward)
      leveledUp = result.leveledUp
      newLevel = result.newLevel

      await db.user.update({
        where: { id: session.user.id },
        data: {
          xp: result.xp,
          level: result.level,
          coins: result.coins,
        },
      })
    }

    if (!completed && task.completed) {
      const user = await db.user.findUnique({
        where: { id: session.user.id },
      })

      if (user) {
        const reward = task.type === "MAIN"
          ? REWARDS.MAIN_COMPLETE
          : REWARDS.DAILY_COMPLETE

        await db.user.update({
          where: { id: session.user.id },
          data: {
            xp: Math.max(0, user.xp - reward.xp),
            coins: Math.max(0, user.coins - reward.coins),
          },
        })
      }
    }

    const updatedTask = await db.task.update({
      where: { id },
      data: {
        completed,
        completedAt: completed ? new Date() : null,
      },
    })

    const updatedUser = await db.user.findUnique({
      where: { id: session.user.id },
    })

    return NextResponse.json({
      task: updatedTask,
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
    console.error("Update task error:", error)
    return NextResponse.json({ error: "更新任务失败" }, { status: 500 })
  }
}

// PUT /api/tasks/[id]/archive - Archive a completed task
export async function PATCH(
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
    const { archived } = body

    const task = await db.task.findUnique({
      where: { id },
    })

    if (!task || task.userId !== session.user.id) {
      return NextResponse.json({ error: "任务不存在" }, { status: 404 })
    }

    if (archived && !task.completed) {
      return NextResponse.json({ error: "只能归档已完成的任务" }, { status: 400 })
    }

    const updatedTask = await db.task.update({
      where: { id },
      data: {
        archived,
        archivedAt: archived ? new Date() : null,
      },
    })

    return NextResponse.json({ task: updatedTask })
  } catch (error) {
    console.error("Archive task error:", error)
    return NextResponse.json({ error: "归档任务失败" }, { status: 500 })
  }
}

// DELETE /api/tasks/[id] - Delete a task
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

    const task = await db.task.findUnique({
      where: { id },
    })

    if (!task || task.userId !== session.user.id) {
      return NextResponse.json({ error: "任务不存在" }, { status: 404 })
    }

    await db.task.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete task error:", error)
    return NextResponse.json({ error: "删除任务失败" }, { status: 500 })
  }
}
