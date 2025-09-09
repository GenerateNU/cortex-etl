'use client'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'

export default function Navbar() {
  const { data: session } = useSession()

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          Cortex ETL
        </Link>
        <div className="flex gap-4">
          {session ? (
            <>
              <Link href="/dashboard">Dashboard</Link>
              {session.user?.role === 'admin' && (
                <Link href="/admin">Admin</Link>
              )}
              <button onClick={() => signOut()}>Logout</button>
            </>
          ) : (
            <Link href="/login">Login</Link>
          )}
        </div>
      </div>
    </nav>
  )
}
