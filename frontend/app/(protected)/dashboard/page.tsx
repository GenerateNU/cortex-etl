'use client'
import { useSession } from 'next-auth/react'

export default function DashboardPage() {
  const { data: session } = useSession()

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <p>Welcome, {session?.user?.email}</p>
      <p>Role: {session?.user?.role}</p>
      <p>Tenant: {session?.user?.tenantId}</p>
    </div>
  )
}
