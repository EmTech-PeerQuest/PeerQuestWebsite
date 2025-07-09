// app/messages/layout.tsx
import type { ReactNode } from "react"

export default function MessagesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="messages-layout h-screen w-full overflow-hidden">
      {children}
    </div>
  )
}
