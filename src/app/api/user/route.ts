import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getLevelTitle, xpForLevel, getSurvivalDays } from "@/lib/rewards"

// GET /api/user - Get current user profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        _count: {
          select: { tasks: true },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 })
    }

    const completedTasks = await db.task.count({
      where: {
        userId: user.id,
        completed: true,
      },
    })

    const survivalDays = getSurvivalDays(user.birthday)

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      birthday: user.birthday,
      level: user.level,
      xp: user.xp,
      coins: user.coins,
      levelTitle: getLevelTitle(user.level),
      xpToNextLevel: xpForLevel(user.level),
      survivalDays,
      totalTasks: user._count.tasks,
      completedTasks,
    })
  } catch (error) {
    console.error("Get user error:", error)
    return NextResponse.json({ error: "获取用户信息失败" }, { status: 500 })
  }
}

// PUT /api/user - Update user profile
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 })
    }

    const body = await req.json()
    const { name, birthday } = body

    const updateData: { name?: string; birthday?: Date } = {}
    if (name) updateData.name = name
    if (birthday) {
      const birthdayDate = new Date(birthday)
      if (!isNaN(birthdayDate.getTime())) {
        updateData.birthday = birthdayDate
      }
    }

    const user = await db.user.update({
      where: { id: session.user.id },
      data: updateData,
    })

    return NextResponse.json({
      id: user.id,
      name: user.name,
      birthday: user.birthday,
    })
  } catch (error) {
    console.error("Update user error:", error)
    return NextResponse.json({ error: "更新用户信息失败" }, { status: 500 })
  }
}
