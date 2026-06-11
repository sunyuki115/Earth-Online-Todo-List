import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { REWARDS, getLevelTitle, xpForLevel, applyReward, calculateStreak } from "@/lib/rewards"

// POST /api/tasks/[id]/checkins - Check in today
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
    const today = new Date().toISOString().split("T")[0]

    const task = await db.task.findUnique({ where: { id } })
    if (!task || task.userId !== session.user.id) {
      return NextResponse.json({ error: "任务不存在" }, { status: 404 })
    }
    if (task.completionMode !== "CHECKIN") {
      return NextResponse.json({ error: "该任务不支持打卡" }, { status: 400 })
    }
    if (task.completed) {
      return NextResponse.json({ error: "任务已完成，无法继续打卡" }, { status: 400 })
    }

    const existing = await db.checkIn.findUnique({
      where: { taskId_date: { taskId: id, date: today } },
    })
    if (existing) {
      return NextResponse.json({ error: "今日已打卡" }, { status: 400 })
    }

    const checkIn = await db.checkIn.create({
      data: { taskId: id, date: today },
    })

    const user = await db.user.findUnique({ where: { id: session.user.id } })
    let leveledUp = false
    let newLevel = 0

    if (user) {
      const result = applyReward(user, REWARDS.CHECKIN)
      leveledUp = result.leveledUp
      newLevel = result.newLevel
      await db.user.update({
        where: { id: session.user.id },
        data: { xp: result.xp, level: result.level, coins: result.coins },
      })
    }

    const allCheckIns = await db.checkIn.findMany({
      where: { taskId: id },
      orderBy: { date: "desc" },
    })

    const updatedUser = await db.user.findUnique({ where: { id: session.user.id } })

    return NextResponse.json({
      checkIn,
      totalCheckIns: allCheckIns.length,
      streakDays: calculateStreak(allCheckIns.map((c) => c.date)),
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
    console.error("Check-in error:", error)
    return NextResponse.json({ error: "打卡失败" }, { status: 500 })
  }
}

// DELETE /api/tasks/[id]/checkins - Cancel today's check-in
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
    const today = new Date().toISOString().split("T")[0]

    const task = await db.task.findUnique({ where: { id } })
    if (!task || task.userId !== session.user.id) {
      return NextResponse.json({ error: "任务不存在" }, { status: 404 })
    }

    const existing = await db.checkIn.findUnique({
      where: { taskId_date: { taskId: id, date: today } },
    })
    if (!existing) {
      return NextResponse.json({ error: "今日未打卡" }, { status: 400 })
    }

    await db.checkIn.delete({ where: { id: existing.id } })

    const user = await db.user.findUnique({ where: { id: session.user.id } })
    if (user) {
      await db.user.update({
        where: { id: session.user.id },
        data: {
          xp: Math.max(0, user.xp - REWARDS.CHECKIN.xp),
          coins: Math.max(0, user.coins - REWARDS.CHECKIN.coins),
        },
      })
    }

    const updatedUser = await db.user.findUnique({ where: { id: session.user.id } })

    return NextResponse.json({
      user: updatedUser ? {
        level: updatedUser.level,
        xp: updatedUser.xp,
        coins: updatedUser.coins,
        levelTitle: getLevelTitle(updatedUser.level),
        xpToNextLevel: xpForLevel(updatedUser.level),
      } : null,
    })
  } catch (error) {
    console.error("Cancel check-in error:", error)
    return NextResponse.json({ error: "取消打卡失败" }, { status: 500 })
  }
}

