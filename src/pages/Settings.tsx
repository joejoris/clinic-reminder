import { useEffect, useState } from 'react'
import { useStore } from '../lib/store'

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function Settings() {
  const { clinic, setClinic, doctors, addDoctor, updateDoctor, availabilityRules, addRule, removeRule, loading, error } = useStore()
  const [profile, setProfile] = useState(clinic)
  const [saving, setSaving] = useState(false)
  const [docForm, setDocForm] = useState({ name: '', specialty: '', phone: '+254' })
  const [ruleForm, setRuleForm] = useState({ doctorId: doctors[0]?.id ?? '', dayOfWeek: 1, startTime: '08:00', endTime: '17:00', slotDurationMinutes: 30 })

  useEffect(() => { setProfile(clinic) }, [clinic])
  useEffect(() => { if (doctors.length && !doctors.find((d) => d.id === ruleForm.doctorId)) setRuleForm((f) => ({ ...f, doctorId: doctors[0].id })) }, [doctors, ruleForm.doctorId])

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try { await setClinic(profile) } finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-[#607166]">Clinic profile, doctors, and availability rules.</p>
        {loading && <p className="text-xs text-[#607166] mt-1">Syncing with backend...</p>}
        {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
      </header>

      <form onSubmit={saveProfile} className="rounded-3xl border border-[#dfe5d8] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Clinic profile</h2>
        <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <label><div className="mb-1 text-[#607166]">Name</div><input className="w-full rounded-xl border border-[#d7ddd1] px-3 py-2" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></label>
          <label><div className="mb-1 text-[#607166]">County</div><input className="w-full rounded-xl border border-[#d7ddd1] px-3 py-2" value={profile.county} onChange={(e) => setProfile({ ...profile, county: e.target.value })} /></label>
          <label><div className="mb-1 text-[#607166]">Timezone</div><input className="w-full rounded-xl border border-[#d7ddd1] px-3 py-2" value={profile.timezone} onChange={(e) => setProfile({ ...profile, timezone: e.target.value })} /></label>
          <label><div className="mb-1 text-[#607166]">Reminder hours (comma-separated)</div><input className="w-full rounded-xl border border-[#d7ddd1] px-3 py-2" value={profile.reminderHours.join(',')} onChange={(e) => setProfile({ ...profile, reminderHours: e.target.value.split(',').map((v) => Number(v.trim())).filter(Boolean) })} /></label>
        </div>
        <button className="mt-4 rounded-xl bg-[#1f6f4a] px-4 py-2 text-sm font-medium text-white disabled:opacity-50" disabled={saving}>{saving ? 'Saving...' : 'Save profile'}</button>
      </form>

      <section className="rounded-3xl border border-[#dfe5d8] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Doctors</h2>
        <div className="mt-4 space-y-3">
          {doctors.map((doc) => (
            <div key={doc.id} className="flex flex-col gap-3 rounded-2xl border border-[#edf1e9] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div><div className="font-medium">{doc.name}</div><div className="text-sm text-[#607166]">{doc.specialty} • {doc.phone}</div></div>
              <button onClick={() => void updateDoctor(doc.id, { active: !doc.active })} className={`rounded-full px-3 py-1 text-xs font-medium ${doc.active ? 'bg-[#e8f3ec] text-[#1f6f4a]' : 'bg-slate-100 text-slate-600'}`}>{doc.active ? 'Active' : 'Inactive'}</button>
            </div>
          ))}
        </div>
        <form className="mt-4 grid gap-3 sm:grid-cols-4" onSubmit={async (e) => { e.preventDefault(); await addDoctor({ ...docForm, active: true }); setDocForm({ name: '', specialty: '', phone: '+254' }) }}>
          <input className="rounded-xl border border-[#d7ddd1] px-3 py-2 text-sm" placeholder="Name" value={docForm.name} onChange={(e) => setDocForm({ ...docForm, name: e.target.value })} required />
          <input className="rounded-xl border border-[#d7ddd1] px-3 py-2 text-sm" placeholder="Specialty" value={docForm.specialty} onChange={(e) => setDocForm({ ...docForm, specialty: e.target.value })} required />
          <input className="rounded-xl border border-[#d7ddd1] px-3 py-2 text-sm" placeholder="Phone" value={docForm.phone} onChange={(e) => setDocForm({ ...docForm, phone: e.target.value })} required />
          <button className="rounded-xl bg-[#1f6f4a] px-3 py-2 text-sm font-medium text-white">Add doctor</button>
        </form>
      </section>

      <section className="rounded-3xl border border-[#dfe5d8] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Availability rules</h2>
        <div className="mt-4 space-y-2">
          {availabilityRules.map((r) => {
            const doc = doctors.find((d) => d.id === r.doctorId)
            return <div key={r.id} className="flex items-center justify-between rounded-xl border border-[#edf1e9] px-3 py-2 text-sm"><div>{doc?.name} • {days[r.dayOfWeek]} {r.startTime}–{r.endTime} ({r.slotDurationMinutes}m)</div><button onClick={() => void removeRule(r.id)} className="text-rose-600">Remove</button></div>
          })}
        </div>
        <form className="mt-4 grid gap-3 sm:grid-cols-5" onSubmit={async (e) => { e.preventDefault(); await addRule(ruleForm) }}>
          <select className="rounded-xl border border-[#d7ddd1] px-3 py-2 text-sm" value={ruleForm.doctorId} onChange={(e) => setRuleForm({ ...ruleForm, doctorId: e.target.value })}>{doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
          <select className="rounded-xl border border-[#d7ddd1] px-3 py-2 text-sm" value={ruleForm.dayOfWeek} onChange={(e) => setRuleForm({ ...ruleForm, dayOfWeek: Number(e.target.value) })}>{days.map((d, i) => <option key={d} value={i}>{d}</option>)}</select>
          <input type="time" className="rounded-xl border border-[#d7ddd1] px-3 py-2 text-sm" value={ruleForm.startTime} onChange={(e) => setRuleForm({ ...ruleForm, startTime: e.target.value })} />
          <input type="time" className="rounded-xl border border-[#d7ddd1] px-3 py-2 text-sm" value={ruleForm.endTime} onChange={(e) => setRuleForm({ ...ruleForm, endTime: e.target.value })} />
          <button className="rounded-xl bg-[#1f6f4a] px-3 py-2 text-sm font-medium text-white">Add rule</button>
        </form>
      </section>
    </div>
  )
}