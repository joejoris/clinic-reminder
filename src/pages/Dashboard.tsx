import { Link } from 'react-router-dom'
import { CalendarClock, CheckCircle2, MessageSquareText, UserX } from '../components/icons'
import { StatusBadge } from '../components/StatusBadge'
import { useStore } from '../lib/store'
import { formatTime } from '../lib/utils'

const AVG_CONSULT_KES = 1500

export function Dashboard() {
  const { appointments, clinic, doctors } = useStore()
  const today = new Date().toISOString().slice(0, 10)
  const todays = appointments.filter((a) => a.startTime.slice(0, 10) === today).sort((a, b) => a.startTime.localeCompare(b.startTime))
  const completed = todays.filter((a) => a.status === 'completed').length
  const noShows = todays.filter((a) => a.status === 'no_show').length
  const remindersSent = todays.flatMap((a) => a.reminderStatuses).filter((s) => s === 'sent' || s === 'delivered').length
  const noShowRate = todays.length ? Math.round((noShows / todays.length) * 100) : 0
  const estimatedLost = noShows * AVG_CONSULT_KES

  const stats = [
    { label: "Today's appointments", value: String(todays.length), icon: CalendarClock, tone: 'bg-[#e8f3ec] text-[#1f6f4a]' },
    { label: 'Reminders sent', value: String(remindersSent), icon: MessageSquareText, tone: 'bg-[#e8f0fb] text-[#2459a8]' },
    { label: 'Completed', value: String(completed), icon: CheckCircle2, tone: 'bg-[#edf7ee] text-[#2f7a42]' },
    { label: 'No-show rate', value: `${noShowRate}%`, icon: UserX, tone: 'bg-[#fff4dd] text-[#9a6700]' },
  ]

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[#1f6f4a]">{clinic.county} • {clinic.timezone}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-[#607166]">Track today’s schedule, reminders, and no-shows at a glance.</p>
        </div>
        <Link to="/appointments?new=1" className="rounded-2xl bg-[#1f6f4a] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#195c3e]">
          New appointment
        </Link>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="rounded-3xl border border-[#dfe5d8] bg-white p-5 shadow-sm">
            <div className={`inline-flex rounded-2xl p-2.5 ${tone}`}><Icon size={18} /></div>
            <div className="mt-4 text-2xl font-semibold">{value}</div>
            <div className="text-sm text-[#607166]">{label}</div>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-[#dfe5d8] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Estimated revenue impact</h2>
            <p className="text-sm text-[#607166]">Simple estimate based on KES {AVG_CONSULT_KES.toLocaleString()} average consultation.</p>
          </div>
          <div className="rounded-2xl bg-[#fff4dd] px-4 py-3 text-sm">
            <div className="text-[#9a6700]">Estimated lost to no-shows today</div>
            <div className="text-xl font-semibold text-[#7a5200]">KES {estimatedLost.toLocaleString()}</div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-[#dfe5d8] bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Today’s appointments</h2>
          <span className="text-sm text-[#607166]">{todays.length} total</span>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="text-[#607166]">
              <tr className="border-b border-[#edf1e9]">
                <th className="py-3 font-medium">Time</th><th className="py-3 font-medium">Patient</th><th className="py-3 font-medium">Doctor</th><th className="py-3 font-medium">Reminders</th><th className="py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {todays.map((apt) => {
                const doctor = doctors.find((d) => d.id === apt.doctorId)
                const delivered = apt.reminderStatuses.filter((s) => s === 'delivered' || s === 'sent').length
                return (
                  <tr key={apt.id} className="border-b border-[#f1f4ee] last:border-0">
                    <td className="py-3 font-medium">{formatTime(apt.startTime)}</td>
                    <td className="py-3"><div className="font-medium">{apt.patientName}</div><div className="text-xs text-[#607166]">{apt.patientPhone}</div></td>
                    <td className="py-3 text-[#425349]">{doctor?.name}</td>
                    <td className="py-3 text-[#425349]">{delivered}/{apt.reminderStatuses.length} sent</td>
                    <td className="py-3"><StatusBadge status={apt.status} /></td>
                  </tr>
                )
              })}
              {!todays.length && <tr><td colSpan={5} className="py-8 text-center text-[#607166]">No appointments today.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}