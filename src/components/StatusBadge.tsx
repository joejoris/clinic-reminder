import { cn, statusLabel } from '../lib/utils'
import type { AppointmentStatus } from '../types'

const styles: Record<AppointmentStatus, string> = {
  scheduled: 'bg-slate-100 text-slate-700',
  confirmed: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  no_show: 'bg-amber-100 text-amber-800',
  cancelled: 'bg-rose-100 text-rose-700',
}

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-medium', styles[status])}>
      {statusLabel(status)}
    </span>
  )
}