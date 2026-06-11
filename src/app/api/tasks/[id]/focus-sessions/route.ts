import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getLevelTitle, xpForLevel, getFocusReward, applyReward } from "@/lib/rewards"

// POST /api/tasks/[id]/focus-sessions - Record a completed focus session
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
    const { duration, startedAt } = body

    if (!duration || ![30, 45, 60].includes(duration)) {
      return NextResponse.json({ error: "专注时长必须是30/45/60分钟" }, { status: 400 })
    }

    const task = await db.task.findUnique({ where: { id } })
    if (!task || task.userId !== session.user.id) {
      return NextResponse.json({ error: "任务不存在" }, { status: 404 })
    }
    if (task.completionMode !== "FOCUS") {
      return NextResponse.json({ error: "该任务不支持专注模式" }, { status: 400 })
    }
    if (task.completed) {
      return NextResponse.json({ error: "任务已完成，无法继续专注" }, { status: 400 })
    }

    const focusSession = await db.focusSession.create({
      data: {
        taskId: id,
        duration,
        startedAt: new Date(startedAt),
      },
    })

    const reward = getFocusReward(duration)
    const user = await db.user.findUnique({ where: { id: session.user.id } })
    let leveledUp = false
    let newLevel = 0

    if (user) {
      const result = applyReward(user, reward)
      leveledUp = result.leveledUp
      newLevel = result.newLevel
      await db.user.update({
        where: { id: session.user.id },
        data: { xp: result.xp, level: result.level, coins: result.coins },
      })
    }

    const allSessions = await db.focusSession.findMany({
      where: { taskId: id },
    })
    const totalMinutes = allSessions.reduce((sum, s) => sum + s.duration, 0)

    const updatedUser = await db.user.findUnique({ where: { id: session.user.id } })

    return NextResponse.json({
      focusSession,
      totalMinutes,
      reward,
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
    console.error("Focus session error:", error)
    return NextResponse.json({ error: "记录专注失败" }, { status: 500 })
  }
}
