'use client'

import dynamic from 'next/dynamic'

// Dynamically import the InvitationNotifications component to avoid SSR issues
const InvitationNotifications = dynamic(
  () => import('./invitation-notifications'),
  { ssr: false }
)

export default function InvitationNotificationsWrapper() {
  return <InvitationNotifications />
}
