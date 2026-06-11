import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { GACHA_COST, drawGacha } from "@/lib/gacha"
import { xpForLevel, getLevelTitle } from "@/lib/rewards"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 })
  }

  const body = await req.json()
  const useFree = body.useFree === true

  const user = await db.user.findUnique({ where: { id: session.user.id } })
  if (!user) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 })
  }

  if (!useFree && user.coins < GACHA_COST) {
    return NextResponse.json({ error: "金币不足" }, { status: 400 })
  }

  const result = drawGacha()

  const coinsAfterDeduct = useFree ? user.coins : user.coins - GACHA_COST
  let newXp = user.xp + result.reward.xp
  let newCoins = coinsAfterDeduct + result.reward.coins
  let newLevel = user.level
  let leveledUp = false

  while (newXp >= xpForLevel(newLevel)) {
    newXp -= xpForLevel(newLevel)
    newLevel += 1
    newCoins += newLevel * 10
    leveledUp = true
  }

  const updated = await db.user.update({
    where: { id: session.user.id },
    data: { xp: newXp, coins: newCoins, level: newLevel },
  })

  return NextResponse.json({
    item: result.item,
    reward: result.reward,
    isCoupon: result.isCoupon,
    user: {
      xp: updated.xp,
      coins: updated.coins,
      level: updated.level,
      levelTitle: getLevelTitle(updated.level),
      xpToNextLevel: xpForLevel(updated.level),
    },
    leveledUp,
    newLevel: leveledUp ? newLevel : 0,
  })
}
