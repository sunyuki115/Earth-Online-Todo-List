import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getLevelTitle, xpForLevel } from "@/lib/rewards"

// POST /api/user/sync - Sync guest data to server account
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 })
    }

    const body = await req.json()
    const { xp, coins, level } = body

    const user = await db.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 })
    }

    // Only allow sync for fresh accounts (level 1, xp 0, coins 0)
    if (user.level > 1 || user.xp > 0 || user.coins > 0) {
      return NextResponse.json({
        level: user.level,
        xp: user.xp,
        coins: user.coins,
        levelTitle: getLevelTitle(user.level),
        xpToNextLevel: xpForLevel(user.level),
      })
    }

    const MAX_SYNC_LEVEL = 50
    const MAX_SYNC_COINS = 10000

    const updateData: Record<string, unknown> = {}
    if (typeof level === "number" && level > 1 && level <= MAX_SYNC_LEVEL) {
      updateData.level = level
    }
    if (typeof xp === "number" && xp >= 0) {
      const maxXp = xpForLevel(typeof level === "number" ? level : 1)
      updateData.xp = Math.min(xp, maxXp)
    }
    if (typeof coins === "number" && coins > 0 && coins <= MAX_SYNC_COINS) {
      updateData.coins = coins
    }

    let updatedUser = user
    if (Object.keys(updateData).length > 0) {
      updatedUser = await db.user.update({
        where: { id: session.user.id },
        data: updateData,
      })
    }

    return NextResponse.json({
      level: updatedUser.level,
      xp: updatedUser.xp,
      coins: updatedUser.coins,
      levelTitle: getLevelTitle(updatedUser.level),
      xpToNextLevel: xpForLevel(updatedUser.level),
    })
  } catch (error) {
    console.error("Sync error:", error)
    return NextResponse.json({ error: "同步失败" }, { status: 500 })
  }
}
