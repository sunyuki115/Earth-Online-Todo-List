import type { Metadata } from "next"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"


export const metadata: Metadata = {
  title: "Earth Online Todo List - 欢迎来到地球online",
  description: "欢迎来到地球online！把每一天的待办变成冒险任务，用游戏的方式对抗拖延和焦虑。",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌍</text></svg>",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className="antialiased bg-background text-foreground"
        style={{
          "--font-geist-sans": "ui-sans-serif, system-ui, -apple-system, sans-serif",
          "--font-geist-mono": "ui-monospace, 'Cascadia Code', 'Fira Code', monospace",
        } as React.CSSProperties}
      >
        {children}
        <Toaster />
      </body>
    </html>
  )
}
