import { Layout } from '../components/layout/Layout'

export function AdminPage() {
  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-slate-100">Admin Panel</h1>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-slate-300 mb-2">
              ETL Operations
            </h3>
            <p className="text-slate-400">
              Admin functionality will be implemented in future phases
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
