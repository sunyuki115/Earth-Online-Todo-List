"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import { loadGuestUser, loadGuestTasks } from "@/lib/guest-storage"

const GUEST_USER_KEY = "earth_online_guest_user"
const GUEST_TASKS_KEY = "earth_online_guest_tasks"

export function AuthModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [birthday, setBirthday] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (isRegister) {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name, birthday }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || "注册失败")
          return
        }
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        })
        if (result?.ok) {
          await migrateGuestData()
          onSuccess()
        } else {
          setError("自动登录失败，请手动登录")
        }
      } else {
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        })
        if (result?.error) {
          setError("邮箱或密码错误")
        } else if (result?.ok) {
          await migrateGuestData()
          onSuccess()
        }
      }
    } catch {
      setError("操作失败，请稍后再试")
    } finally {
      setLoading(false)
    }
  }

  const migrateGuestData = async () => {
    try {
      const guestTasks = loadGuestTasks()
      const guestUser = loadGuestUser()

      const hasGuestData = guestTasks.length > 0 || guestUser.xp > 0 || guestUser.coins > 0
      if (!hasGuestData) return

      for (const task of guestTasks) {
        await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: task.title,
            type: task.type,
            completionMode: task.completionMode,
          }),
        })
      }

      await fetch("/api/user/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          xp: guestUser.xp,
          coins: guestUser.coins,
          level: guestUser.level,
        }),
      })

      localStorage.removeItem(GUEST_USER_KEY)
      localStorage.removeItem(GUEST_TASKS_KEY)
    } catch (err) {
      console.error("Migration failed:", err)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-3 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md z-50 flex items-center justify-center"
            style={{ maxHeight: "90vh" }}
          >
            <div className="pixel-card p-5 sm:p-6 w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
              {/* Close button */}
              <button
                onClick={onClose}
                className="pixel-btn bg-earth-red text-white pixel-font text-[10px] px-3 py-2 mb-5"
              >
                ✕ 返回
              </button>

              <div className="text-center mb-5">
                <div className="text-4xl mb-3">🎮</div>
                <h2 className="pixel-font text-xs text-earth-brown mb-2">
                  {isRegister ? "创建冒险者档案" : "冒险者登录"}
                </h2>
                <p className="text-earth-text-light text-xs">
                  {isRegister
                    ? "注册后数据将永久保存，换设备也能恢复"
                    : "登录后同步你的游戏数据"}
                </p>
              </div>

              {/* Tab Switcher - Pixel style */}
              <div className="flex mb-5">
                <button
                  onClick={() => { setIsRegister(false); setError("") }}
                  className={`flex-1 py-2.5 pixel-font text-[10px] ${
                    !isRegister
                      ? "bg-[#C89B4E] text-white border-4 border-[#C89B4E] border-b-0 -mb-1"
                      : "bg-earth-cream text-earth-text-light"
                  }`}
                >
                  登录
                </button>
                <button
                  onClick={() => { setIsRegister(true); setError("") }}
                  className={`flex-1 py-2.5 pixel-font text-[10px] ${
                    isRegister
                      ? "bg-[#C89B4E] text-white border-4 border-[#C89B4E] border-b-0 -mb-1"
                      : "bg-earth-cream text-earth-text-light"
                  }`}
                >
                  注册
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="pixel-font text-[10px] text-earth-brown block mb-1.5">
                    📧 邮箱
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 pixel-input text-xs"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label className="pixel-font text-[10px] text-earth-brown block mb-1.5">
                    🔒 密码
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-3 py-2.5 pixel-input text-xs"
                    placeholder="至少6个字符"
                  />
                </div>

                {isRegister && (
                  <>
                    <div>
                      <label className="pixel-font text-[10px] text-earth-brown block mb-1.5">
                        🎮 冒险者昵称
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full px-3 py-2.5 pixel-input text-xs"
                        placeholder="你的游戏昵称"
                      />
                    </div>
                    <div>
                      <label className="pixel-font text-[10px] text-earth-brown block mb-1.5">
                        🎂 生日（降临地球日）
                      </label>
                      <input
                        type="date"
                        value={birthday}
                        onChange={(e) => setBirthday(e.target.value)}
                        required
                        className="w-full px-3 py-2.5 pixel-input text-xs"
                      />
                    </div>
                  </>
                )}

                {error && (
                  <div className="p-2.5 bg-earth-red/15 border-2 border-earth-red text-earth-red text-xs pixel-border-thin">
                    ⚠️ {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 pixel-btn bg-[#C89B4E] text-white pixel-font text-[10px]
                    disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "..." : isRegister ? "🎮 创建并迁移数据" : "🔑 登录"}
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
