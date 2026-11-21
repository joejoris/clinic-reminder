import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api } from './api'
import { appointments as seedAppointments, availabilityRules as seedRules, clinic as seedClinic, doctors as seedDoctors } from './mock'
import type { Appointment, AvailabilityRule, Clinic, Doctor } from '../types'

type Store = {
  clinic: Clinic
  doctors: Doctor[]
  availabilityRules: AvailabilityRule[]
  appointments: Appointment[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  setClinic: (c: Clinic) => Promise<void>
  addDoctor: (d: Omit<Doctor, 'id'>) => Promise<void>
  updateDoctor: (id: string, patch: Partial<Doctor>) => Promise<void>
  addRule: (r: Omit<AvailabilityRule, 'id'>) => Promise<void>
  removeRule: (id: string) => Promise<void>
  addAppointment: (a: Omit<Appointment, 'id'>) => Promise<void>
  updateAppointment: (id: string, patch: Partial<Appointment>) => Promise<void>
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [clinic, setClinicState] = useState<Clinic>(seedClinic)
  const [doctors, setDoctors] = useState<Doctor[]>(seedDoctors)
  const [availabilityRules, setAvailabilityRules] = useState<AvailabilityRule[]>(seedRules)
  const [appointments, setAppointments] = useState<Appointment[]>(seedAppointments)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    try {
      setLoading(true)
      setError(null)
      const c = await api.getClinic()
      if (!c) { setLoading(false); return }
      setClinicState(c)
      const [d, r, a] = await Promise.all([api.getDoctors(c.id), api.getRules(c.id), api.getAppointments(c.id)])
      setDoctors(d)
      setAvailabilityRules(r)
      setAppointments(a)
    } catch (e: any) {
      setError(e.message || 'Failed to load data from API')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void refresh() }, [])

  const value = useMemo<Store>(() => ({
    clinic, doctors, availabilityRules, appointments, loading, error, refresh,
    setClinic: async (c) => { const saved = await api.updateClinic(c.id, c); setClinicState(saved) },
    addDoctor: async (d) => { const saved = await api.addDoctor(clinic.id, d); setDoctors((p) => [...p, saved]) },
    updateDoctor: async (id, patch) => { const saved = await api.updateDoctor(id, patch); setDoctors((p) => p.map((d) => d.id === id ? saved : d)) },
    addRule: async (r) => { const saved = await api.addRule(r); setAvailabilityRules((p) => [...p, saved]) },
    removeRule: async (id) => { await api.removeRule(id); setAvailabilityRules((p) => p.filter((r) => r.id !== id)) },
    addAppointment: async (a) => { const saved = await api.addAppointment(clinic.id, a); setAppointments((p) => [...p, saved]) },
    updateAppointment: async (id, patch) => { const saved = await api.updateAppointment(id, patch); setAppointments((p) => p.map((a) => a.id === id ? saved : a)) },
  }), [clinic, doctors, availabilityRules, appointments, loading, error])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}