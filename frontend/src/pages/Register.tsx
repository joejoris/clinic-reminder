import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, authToken } from '../lib/api'

export function Register({ onAuth }: { onAuth: () => void }) {
  const nav = useNavigate()
  const [form, setForm] = useState({ clinic_name: '', name: '', email: '', username: '', password: '', phone: '+254' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await api.register(form)
      authToken.set(res.token)
      onAuth()
      nav('/')
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })) }

  return (
    <div className="min-h-screen bg-[#f5f7f2] flex items-center justify-center px-4 py-8">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-[#dfe5d8] bg-white p-6 shadow-sm space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
          <p className="text-sm text-[#607166] mt-1">Create your clinic account to start managing appointments and reminders.</p>
        </div>
        <label className="block text-sm"><div className="mb-1 font-medium">Clinic name</div><input className="w-full rounded-xl border border-[#d7ddd1] px-3 py-2" value={form.clinic_name} onChange={(e) => set('clinic_name', e.target.value)} required /></label>
        <label className="block text-sm"><div className="mb-1 font-medium">Your name</div><input className="w-full rounded-xl border border-[#d7ddd1] px-3 py-2" value={form.name} onChange={(e) => set('name', e.target.value)} /></label>
        <label className="block text-sm"><div className="mb-1 font-medium">Email</div><input type="email" className="w-full rounded-xl border border-[#d7ddd1] px-3 py-2" value={form.email} onChange={(e) => set('email', e.target.value)} /></label>
        <label className="block text-sm"><div className="mb-1 font-medium">Username</div><input className="w-full rounded-xl border border-[#d7ddd1] px-3 py-2" value={form.username} onChange={(e) => set('username', e.target.value)} required /></label>
        <label className="block text-sm"><div className="mb-1 font-medium">Phone</div><input className="w-full rounded-xl border border-[#d7ddd1] px-3 py-2" value={form.phone} onChange={(e) => set('phone', e.target.value)} /></label>
        <label className="block text-sm"><div className="mb-1 font-medium">Password</div><input type="password" className="w-full rounded-xl border border-[#d7ddd1] px-3 py-2" value={form.password} onChange={(e) => set('password', e.target.value)} required minLength={8} /></label>
        {error && <div className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
        <button className="w-full rounded-xl bg-[#1f6f4a] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50" disabled={loading}>{loading ? 'Creating account...' : 'Create account'}</button>
        <p className="text-sm text-[#607166]">Already have an account? <Link to="/login" className="text-[#1f6f4a] font-medium">Sign in</Link></p>
      </form>
    </div>
  )
}