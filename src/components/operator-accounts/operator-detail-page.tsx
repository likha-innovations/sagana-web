import { useParams, Link } from 'react-router'
import { ArrowLeft, User } from 'lucide-react'

export function OperatorDetailPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center gap-4">
        <Link
          to="/admin/operator-accounts"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-foreground hover:bg-[#F2F1EB] transition-colors cursor-pointer"
          aria-label="Back to operator accounts"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manage Operator</h1>
          <p className="text-xs text-text-email">Operator ID: {id}</p>
        </div>
      </div>

      <div className="rounded-[20px] bg-white p-6 shadow-card border border-border">
        <div className="flex items-center gap-4 pb-6 border-b border-border">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-700">
            <User className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Operator Details</h2>
            <p className="text-xs text-text-email">
              Manage credentials, permissions, and assignment.
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-3 text-xs text-foreground">
          <p>This is the detail view for operator account <strong className="text-primary">{id}</strong>.</p>
        </div>
      </div>
    </div>
  )
}

export default OperatorDetailPage
