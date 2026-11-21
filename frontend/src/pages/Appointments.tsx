import { Fragment, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus } from '../components/icons'
import { StatusBadge } from '../components/StatusBadge'
import { useStore } from '../lib/store'
import { formatDate, formatTime } from '../lib/utils'
import type { AppointmentStatus, ReminderStatus } from '../types'

const today = new Date().toISOString().slice(0, 10)

function reminderStyle(s: ReminderStatus) {
  return ({ queued: 'bg-slate-100 text-slate-700', sent: 'bg-blue-100 text-blue-700', delivered: 'bg-emerald-100 text-emerald-700', failed: 'bg-rose-100 text-rose-700', opted_out: 'bg-amber-100 text-amber-800' } as Record<string, string>)[s] || 'bg-slate-100'
}

function downloadCsv(name: string, rows: string[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  a.download = name
  a.click()
  URL.revokeObjectURL(a.href)
}

export function Appointments() {
  const { appointments, doctors, availabilityRules, clinic, addAppointment, updateAppointment } = useStore()
  const [params] = useSearchParams()
  const [doctorFilter, setDoctorFilter] = useState('all')
  const [date, setDate] = useState(today)
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(params.get('new') === '1')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [rescheduleId, setRescheduleId] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [form, setForm] = useState({ patientName: '', patientPhone: '+254', doctorId: doctors[0]?.id ?? '', date: today, time: '', notes: '', consent: false, source: 'phone' as 'phone' | 'walk_in' | 'manual' })

  useEffect(() => { if (doctors.length && !doctors.find((d) => d.id === form.doctorId)) setForm((f) => ({ ...f, doctorId: doctors[0].id })) }, [doctors, form.doctorId])

  const slots = useMemo(() => {
    const day = new Date(`${form.date}T00:00:00`).getDay()
    const rules = availabilityRules.filter((r) => r.doctorId === form.doctorId && r.dayOfWeek === day)
    const out: string[] = []
    for (const rule of rules) {
      const [sh, sm] = rule.startTime.split(':').map(Number)
      const [eh, em] = rule.endTime.split(':').map(Number)
      let cur = sh * 60 + sm
      const end = eh * 60 + em
      while (cur + rule.slotDurationMinutes <= end) {
        const t = `${String(Math.floor(cur / 60)).padStart(2, '0')}:${String(cur % 60).padStart(2, '0')}`
        const iso = `${form.date}T${t}:00`
        const blocked = appointments.some((a) => a.id !== rescheduleId && a.doctorId === form.doctorId && a.status !== 'cancelled' && a.startTime === iso)
        if (!blocked) out.push(t)
        cur += rule.slotDurationMinutes
      }
    }
    return out
  }, [form.doctorId, form.date, appointments, availabilityRules, rescheduleId])

  const filtered = useMemo(() => appointments
    .filter((a) => a.startTime.slice(0, 10) === date)
    .filter((a) => doctorFilter === 'all' || a.doctorId === doctorFilter)
    .filter((a) => !q || `${a.patientName} ${a.patientPhone}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => a.startTime.localeCompare(b.startTime)), [appointments, doctorFilter, date, q])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!form.time || !form.consent) return
    setSaveError(null)
    const [h, m] = form.time.split(':').map(Number)
    const end = new Date(`${form.date}T00:00:00`)
    end.setHours(h, m + 30, 0, 0)
    const endTime = `${form.date}T${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}:00`
    const startTime = `${form.date}T${form.time}:00`
    const now = new Date().toISOString()
    try {
      if (rescheduleId) {
        await updateAppointment(rescheduleId, { doctorId: form.doctorId, patientName: form.patientName, patientPhone: form.patientPhone, startTime, endTime, status: 'scheduled', notes: form.notes || undefined, consentCaptured: form.consent, source: form.source, cancelReason: undefined })
      } else {
        await addAppointment({ doctorId: form.doctorId, patientName: form.patientName, patientPhone: form.patientPhone, startTime, endTime, status: 'scheduled', notes: form.notes || undefined, consentCaptured: form.consent, reminderStatuses: ['queued', 'queued'], source: form.source, createdAt: now, statusChangedAt: now })
      }
      setOpen(false)
      setRescheduleId(null)
      setForm((f) => ({ ...f, patientName: '', patientPhone: '+254', time: '', notes: '', consent: false }))
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save appointment')
    }
  }

  function startReschedule(id: string) {
    const a = appointments.find((x) => x.id === id)
    if (!a) return
    setForm({ patientName: a.patientName, patientPhone: a.patientPhone, doctorId: a.doctorId, date: a.startTime.slice(0, 10), time: a.startTime.slice(11, 16), notes: a.notes || '', consent: a.consentCaptured, source: a.source })
    setRescheduleId(id)
    setOpen(true)
  }

  async function changeStatus(id: string, status: AppointmentStatus) {
    try {
      if (status === 'cancelled') {
        const reason = window.prompt('Cancellation reason (optional):') || undefined
        await updateAppointment(id, { status, cancelReason: reason })
        return
      }
      await updateAppointment(id, { status, cancelReason: undefined })
    } catch (err: any) {
      setSaveError(err.message || 'Failed to update appointment')
    }
  }

  function exportCsv() {
    const rows = [['Date', 'Time', 'Patient', 'Phone', 'Doctor', 'Status', 'Source', 'Consent', 'Cancel reason', 'Notes']]
    for (const a of filtered) {
      const doc = doctors.find((d) => d.id === a.doctorId)
      rows.push([a.startTime.slice(0, 10), formatTime(a.startTime), a.patientName, a.patientPhone, doc?.name || '', a.status, a.source, a.consentCaptured ? 'yes' : 'no', a.cancelReason || '', a.notes || ''])
    }
    downloadCsv(`appointments-${date}.csv`, rows)
  }

  const selectedDoctor = doctors.find((d) => d.id === form.doctorId)
  const preview = form.time ? `Hi ${form.patientName || '[patient]'}, reminder: appointment at ${clinic.name} with ${selectedDoctor?.name} on ${formatDate(`${form.date}T00:00:00`)} at ${form.time}. Reply STOP to opt out.` : 'Select a slot to preview the SMS reminder.'

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Appointments</h1>
          <p className="mt-1 text-sm text-[#607166]">Book, confirm, reschedule, and track no-shows for {formatDate(`${date}T00:00:00`)}.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCsv} className="rounded-2xl border border-[#d7ddd1] bg-white px-4 py-2.5 text-sm font-medium text-[#425349] hover:bg-[#f7faf5]">Export CSV</button>
          <button onClick={() => { setRescheduleId(null); setOpen((v) => !v) }} className="inline-flex items-center gap-2 rounded-2xl bg-[#1f6f4a] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#195c3e]"><Plus size={16} /> New appointment</button>
        </div>
      </header>

      {open && (
        <form onSubmit={save} className="grid gap-4 rounded-3xl border border-[#dfe5d8] bg-white p-5 shadow-sm lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm"><div className="mb-1 font-medium">Patient name</div><input className="w-full rounded-xl border border-[#d7ddd1] px-3 py-2" value={form.patientName} onChange={(e) => setForm({ ...form, patientName: e.target.value })} required /></label>
              <label className="text-sm"><div className="mb-1 font-medium">Patient phone (E.164)</div><input className="w-full rounded-xl border border-[#d7ddd1] px-3 py-2" value={form.patientPhone} onChange={(e) => setForm({ ...form, patientPhone: e.target.value })} required /></label>
              <label className="text-sm"><div className="mb-1 font-medium">Doctor</div><select className="w-full rounded-xl border border-[#d7ddd1] px-3 py-2" value={form.doctorId} onChange={(e) => setForm({ ...form, doctorId: e.target.value, time: '' })}>{doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
              <label className="text-sm"><div className="mb-1 font-medium">Source</div><select className="w-full rounded-xl border border-[#d7ddd1] px-3 py-2" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value as any })}><option value="phone">Phone</option><option value="walk_in">Walk-in</option><option value="manual">Manual</option></select></label>
              <label className="text-sm"><div className="mb-1 font-medium">Date</div><input type="date" className="w-full rounded-xl border border-[#d7ddd1] px-3 py-2" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value, time: '' })} required /></label>
              <label className="text-sm"><div className="mb-1 font-medium">Notes (non-clinical)</div><input className="w-full rounded-xl border border-[#d7ddd1] px-3 py-2" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional" /></label>
            </div>
            <div>
              <div className="mb-2 text-sm font-medium">Available slots</div>
              <div className="flex flex-wrap gap-2">{slots.length ? slots.map((s) => <button key={s} type="button" onClick={() => setForm({ ...form, time: s })} className={`rounded-xl px-3 py-2 text-sm border ${form.time === s ? 'bg-[#1f6f4a] text-white border-[#1f6f4a]' : 'border-[#d7ddd1] hover:bg-[#f7faf5]'}`}>{s}</button>) : <div className="text-sm text-[#607166]">No available slots for this doctor/date.</div>}</div>
            </div>
            <label className="flex items-start gap-2 text-sm text-[#425349]"><input type="checkbox" className="mt-1" checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} required /><span>Patient consents to receive appointment reminders by SMS. Opt-out (STOP) will be honored.</span></label>
            {saveError && <div className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{saveError}</div>}
            <div className="flex gap-3">
              <button type="submit" className="rounded-xl bg-[#1f6f4a] px-4 py-2 text-sm font-medium text-white disabled:opacity-50" disabled={!form.time || !form.consent}>{rescheduleId ? 'Save reschedule' : 'Save appointment'}</button>
              <button type="button" onClick={() => { setOpen(false); setRescheduleId(null); setSaveError(null) }} className="rounded-xl border border-[#d7ddd1] px-4 py-2 text-sm">Cancel</button>
            </div>
          </div>
          <div className="rounded-2xl bg-[#f7faf5] p-4 text-sm">
            <div className="font-medium text-[#223129]">SMS preview</div>
            <p className="mt-2 leading-6 text-[#425349]">{preview}</p>
            <div className="mt-4 text-xs text-[#607166]">Reminders scheduled: {clinic.reminderHours.join('h, ')}h before appointment.</div>
            {rescheduleId && <div className="mt-3 rounded-xl bg-[#fff4dd] px-3 py-2 text-xs text-[#8a6500]">Rescheduling existing appointment.</div>}
          </div>
        </form>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="filter-date" className="text-sm text-[#607166]">Date</label>
        <input id="filter-date" type="date" className="rounded-xl border border-[#d7ddd1] bg-white px-3 py-2 text-sm" value={date} onChange={(e) => setDate(e.target.value)} />
        <label htmlFor="filter-doctor" className="text-sm text-[#607166]">Doctor</label>
        <select id="filter-doctor" className="rounded-xl border border-[#d7ddd1] bg-white px-3 py-2 text-sm" value={doctorFilter} onChange={(e) => setDoctorFilter(e.target.value)}><option value="all">All doctors</option>{doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
        <input className="rounded-xl border border-[#d7ddd1] bg-white px-3 py-2 text-sm" placeholder="Search patient/phone" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <section className="rounded-3xl border border-[#dfe5d8] bg-white p-5 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="text-[#607166]"><tr className="border-b border-[#edf1e9]"><th className="py-3 font-medium">Time</th><th className="py-3 font-medium">Patient</th><th className="py-3 font-medium">Doctor</th><th className="py-3 font-medium">Reminders</th><th className="py-3 font-medium">Status</th><th className="py-3 font-medium">Actions</th></tr></thead>
            <tbody>
              {filtered.map((apt) => {
                const doctor = doctors.find((d) => d.id === apt.doctorId)
                const sent = apt.reminderStatuses.filter((s) => s === 'delivered' || s === 'sent').length
                const isOpen = expanded === apt.id
                return (
                  <Fragment key={apt.id}>
                    <tr className="border-b border-[#f1f4ee]">
                      <td className="py-3 font-medium">{formatTime(apt.startTime)}</td>
                      <td className="py-3"><div className="font-medium">{apt.patientName}</div><div className="text-xs text-[#607166]">{apt.patientPhone} • {apt.source}</div></td>
                      <td className="py-3">{doctor?.name}</td>
                      <td className="py-3"><button className="text-[#1f6f4a] underline underline-offset-2" onClick={() => setExpanded(isOpen ? null : apt.id)}>{sent}/{apt.reminderStatuses.length} sent</button></td>
                      <td className="py-3"><StatusBadge status={apt.status} /></td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <select className="rounded-lg border border-[#d7ddd1] px-2 py-1 text-xs" value={apt.status} onChange={(e) => changeStatus(apt.id, e.target.value as AppointmentStatus)}>
                            {['scheduled', 'confirmed', 'completed', 'no_show', 'cancelled'].map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <button className="rounded-lg border border-[#d7ddd1] px-2 py-1 text-xs hover:bg-[#f7faf5]" onClick={() => startReschedule(apt.id)}>Reschedule</button>
                        </div>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="border-b border-[#f1f4ee] bg-[#fbfcfa]">
                        <td colSpan={6} className="px-2 py-3">
                          <div className="flex flex-wrap gap-3 text-xs">
                            <div><span className="text-[#607166]">Consent:</span> {apt.consentCaptured ? 'Captured' : 'Missing'}</div>
                            <div><span className="text-[#607166]">Notes:</span> {apt.notes || '—'}</div>
                            <div><span className="text-[#607166]">Cancel reason:</span> {apt.cancelReason || '—'}</div>
                            <div className="flex items-center gap-2"><span className="text-[#607166]">Reminders:</span>{apt.reminderStatuses.map((s, i) => <span key={i} className={`rounded-full px-2 py-0.5 ${reminderStyle(s)}`}>{clinic.reminderHours[i] ?? '?'}h: {s}</span>)}</div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
              {!filtered.length && <tr><td colSpan={6} className="py-8 text-center text-[#607166]">No appointments for this date/filter.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}