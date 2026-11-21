import type { Appointment, AvailabilityRule, Clinic, Doctor } from '../types'

const BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Request failed: ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

const toClinic = (c: any): Clinic => ({
  id: String(c.id), name: c.name, county: c.county || '', timezone: c.timezone || 'Africa/Nairobi', reminderHours: c.reminder_hours || [24, 2],
})
const toDoctor = (d: any): Doctor => ({
  id: String(d.id), name: d.name, specialty: d.specialty || '', phone: d.phone || '', active: !!d.active,
})
const toRule = (r: any): AvailabilityRule => ({
  id: String(r.id), doctorId: String(r.doctor), dayOfWeek: r.day_of_week, startTime: r.start_time?.slice(0, 5), endTime: r.end_time?.slice(0, 5), slotDurationMinutes: r.slot_duration_minutes,
})
const toAppt = (a: any): Appointment => ({
  id: String(a.id), doctorId: String(a.doctor), patientName: a.patient_name, patientPhone: a.patient_phone_e164,
  startTime: a.start_time, endTime: a.end_time, status: a.status, source: a.source || 'phone',
  notes: a.notes || undefined, cancelReason: a.cancel_reason || undefined, consentCaptured: !!a.consent_captured_at,
  reminderStatuses: (a.reminders || []).map((r: any) => r.delivery_status),
  createdAt: a.created_at, statusChangedAt: a.status_changed_at,
})

export const api = {
  async getClinic(): Promise<Clinic | null> {
    const data = await req<any>('/clinics/')
    const c = data.results?.[0]
    return c ? toClinic(c) : null
  },
  async updateClinic(id: string, patch: Partial<Clinic>) {
    const body: any = {}
    if (patch.name !== undefined) body.name = patch.name
    if (patch.county !== undefined) body.county = patch.county
    if (patch.timezone !== undefined) body.timezone = patch.timezone
    if (patch.reminderHours !== undefined) body.reminder_hours = patch.reminderHours
    return toClinic(await req(`/clinics/${id}/`, { method: 'PATCH', body: JSON.stringify(body) }))
  },
  async getDoctors(clinicId: string): Promise<Doctor[]> {
    const data = await req<any>(`/doctors/?clinic=${clinicId}`)
    return (data.results || []).map(toDoctor)
  },
  async addDoctor(clinicId: string, d: Omit<Doctor, 'id'>) {
    return toDoctor(await req('/doctors/', { method: 'POST', body: JSON.stringify({ clinic: Number(clinicId), name: d.name, specialty: d.specialty, phone: d.phone, active: d.active }) }))
  },
  async updateDoctor(id: string, patch: Partial<Doctor>) {
    const body: any = {}
    if (patch.name !== undefined) body.name = patch.name
    if (patch.specialty !== undefined) body.specialty = patch.specialty
    if (patch.phone !== undefined) body.phone = patch.phone
    if (patch.active !== undefined) body.active = patch.active
    return toDoctor(await req(`/doctors/${id}/`, { method: 'PATCH', body: JSON.stringify(body) }))
  },
  async getRules(clinicId: string): Promise<AvailabilityRule[]> {
    const data = await req<any>(`/availability-rules/?clinic=${clinicId}`)
    return (data.results || []).map(toRule)
  },
  async addRule(r: Omit<AvailabilityRule, 'id'>) {
    return toRule(await req('/availability-rules/', { method: 'POST', body: JSON.stringify({ doctor: Number(r.doctorId), day_of_week: r.dayOfWeek, start_time: r.startTime, end_time: r.endTime, slot_duration_minutes: r.slotDurationMinutes, is_active: true }) }))
  },
  async removeRule(id: string) { await req(`/availability-rules/${id}/`, { method: 'DELETE' }) },
  async getAppointments(clinicId: string): Promise<Appointment[]> {
    const data = await req<any>(`/appointments/?clinic=${clinicId}`)
    return (data.results || []).map(toAppt)
  },
  async addAppointment(clinicId: string, a: Omit<Appointment, 'id'>) {
    return toAppt(await req('/appointments/', {
      method: 'POST',
      body: JSON.stringify({
        clinic: Number(clinicId), doctor: Number(a.doctorId), patient_name: a.patientName, patient_phone_e164: a.patientPhone,
        start_time: a.startTime, end_time: a.endTime, status: a.status, source: a.source, notes: a.notes || '',
        cancel_reason: a.cancelReason || '', consent_captured_at: a.consentCaptured ? new Date().toISOString() : null, consent_channel: a.consentCaptured ? 'sms' : '',
      }),
    }))
  },
  async updateAppointment(id: string, patch: Partial<Appointment>) {
    const body: any = {}
    if (patch.doctorId !== undefined) body.doctor = Number(patch.doctorId)
    if (patch.patientName !== undefined) body.patient_name = patch.patientName
    if (patch.patientPhone !== undefined) body.patient_phone_e164 = patch.patientPhone
    if (patch.startTime !== undefined) body.start_time = patch.startTime
    if (patch.endTime !== undefined) body.end_time = patch.endTime
    if (patch.status !== undefined) body.status = patch.status
    if (patch.source !== undefined) body.source = patch.source
    if (patch.notes !== undefined) body.notes = patch.notes
    if (patch.cancelReason !== undefined) body.cancel_reason = patch.cancelReason
    if (patch.consentCaptured !== undefined) { body.consent_captured_at = patch.consentCaptured ? new Date().toISOString() : null; body.consent_channel = patch.consentCaptured ? 'sms' : '' }
    return toAppt(await req(`/appointments/${id}/`, { method: 'PATCH', body: JSON.stringify(body) }))
  },
}