import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, name, birthday } = body

    if (!email || !password || !name || !birthday) {
      return NextResponse.json(
        { error: "请填写所有必填字段" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "密码至少需要6个字符" },
        { status: 400 }
      )
    }

    const existingUser = await db.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "该邮箱已被注册" },
        { status: 400 }
      )
    }

    const birthdayDate = new Date(birthday)
    if (isNaN(birthdayDate.getTime())) {
      return NextResponse.json(
        { error: "请输入有效的出生日期" },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        birthday: birthdayDate,
        level: 1,
        xp: 0,
        coins: 0,
      },
    })

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "注册失败，请稍后再试" },
      { status: 500 }
    )
  }
}
