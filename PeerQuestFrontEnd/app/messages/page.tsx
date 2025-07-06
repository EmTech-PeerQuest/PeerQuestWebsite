// app/messaging/page.tsx
"use client"

import { MessagingSystem } from "@/components/messaging/messaging-system"

export default function MessagingPage() {
  return (
    <MessagingSystem
      currentUser={null} // will be fetched in the component
      showToast={(msg, type) => console.log(`${type || "info"}: ${msg}`)}
    />
  )
}
