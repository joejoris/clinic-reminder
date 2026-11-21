import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, authToken } from '../lib/api'

export function Login({ onAuth }: { onAuth: () => void }) {
  const nav = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await api.login(form)
      authToken.set(res.token)
      onAuth()
      nav('/')
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f7f2] flex items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-[#dfe5d8] bg-white p-6 shadow-sm space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="text-sm text-[#607166] mt-1">Sign in to manage your clinic appointments and reminders.</p>
        </div>
        <label className="block text-sm"><div className="mb-1 font-medium">Username or email</div><input className="w-full rounded-xl border border-[#d7ddd1] px-3 py-2" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required /></label>
        <label className="block text-sm"><div className="mb-1 font-medium">Password</div><input type="password" className="w-full rounded-xl border border-[#d7ddd1] px-3 py-2" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></label>
        {error && <div className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
        <button className="w-full rounded-xl bg-[#1f6f4a] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
        <p className="text-sm text-[#607166]">No account? <Link to="/register" className="text-[#1f6f4a] font-medium">Create one</Link></p>
      </form>
    </div>
  )
}