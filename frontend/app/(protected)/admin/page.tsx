'use client'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'

export default function AdminPage() {
  const { data: session } = useSession()

  if (session?.user?.role !== 'admin') {
    redirect('/dashboard')
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
      <p>Tenant Management</p>
    </div>
  )
}
