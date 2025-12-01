import React from 'react'
import { Navbar } from './Navbar'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="h-screen bg-slate-900 flex flex-col overflow-hidden">
      <Navbar />
      <main className="flex-1 overflow-hidden min-h-0">
        <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col min-h-0">
          {children}
        </div>
      </main>
    </div>
  )
}
