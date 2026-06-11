import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// GET /api/tasks - Get all tasks for the current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 })
    }

    const tasks = await db.task.findMany({
      where: { userId: session.user.id },
      include: {
        subTasks: { orderBy: { createdAt: "asc" } },
        checkIns: { orderBy: { date: "desc" } },
        focusSessions: { orderBy: { startedAt: "desc" } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error("Get tasks error:", error)
    return NextResponse.json({ error: "获取任务失败" }, { status: 500 })
  }
}

// POST /api/tasks - Create a new task
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 })
    }

    const body = await req.json()
    const { title, type = "DAILY", completionMode = null, subTasks } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: "任务标题不能为空" }, { status: 400 })
    }

    if (type === "DAILY" && completionMode) {
      return NextResponse.json({ error: "日常任务不支持完成模式" }, { status: 400 })
    }

    const validModes = ["SUBTASK", "CHECKIN", "FOCUS"]
    if (completionMode && !validModes.includes(completionMode)) {
      return NextResponse.json({ error: "无效的完成模式" }, { status: 400 })
    }

    const task = await db.task.create({
      data: {
        userId: session.user.id,
        title: title.trim(),
        type,
        completionMode: type === "MAIN" ? completionMode : null,
        xpReward: 10,
        coinReward: 5,
        subTasks: completionMode === "SUBTASK" && subTasks?.length
          ? {
              create: subTasks.map((st: { title: string }) => ({
                title: st.title.trim(),
              })),
            }
          : undefined,
      },
      include: {
        subTasks: { orderBy: { createdAt: "asc" } },
        checkIns: true,
        focusSessions: true,
      },
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error("Create task error:", error)
    return NextResponse.json({ error: "创建任务失败" }, { status: 500 })
  }
}
