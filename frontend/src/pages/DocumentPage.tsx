import React from 'react'
import { Layout } from '../components/layout/Layout'
import { useAuth } from '../contexts/AuthContext'

export function DocumentPage() {
  const { currentTenant } = useAuth()

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-slate-100">Documents</h1>
          {currentTenant && (
            <div className="text-sm text-slate-400">
              Tenant: {currentTenant.name}
            </div>
          )}
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
          <div className="text-center py-12">
            <svg
              className="mx-auto h-16 w-16 text-slate-600 mb-4"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <h3 className="text-lg font-medium text-slate-300 mb-2">
              No documents yet
            </h3>
            <p className="text-slate-400 mb-6">
              Upload files to get started with data processing
            </p>
            <button className="inline-flex items-center px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors">
              Upload Files
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
