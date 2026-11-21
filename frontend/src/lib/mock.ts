import type { Appointment, AvailabilityRule, Clinic, Doctor } from '../types'

const today = new Date()
const y = today.getFullYear()
const m = String(today.getMonth() + 1).padStart(2, '0')
const d = String(today.getDate()).padStart(2, '0')
const base = `${y}-${m}-${d}`
const now = new Date().toISOString()

export const clinic: Clinic = {
  id: 'clinic_1',
  name: 'Majiwa Family Clinic',
  county: 'Nairobi',
  timezone: 'Africa/Nairobi',
  reminderHours: [24, 2],
}

export const doctors: Doctor[] = [
  { id: 'doc_1', name: 'Dr. Amina Wanjiku', specialty: 'General Practice', phone: '+254712000001', active: true },
  { id: 'doc_2', name: 'Dr. Brian Otieno', specialty: 'Pediatrics', phone: '+254712000002', active: true },
]

export const availabilityRules: AvailabilityRule[] = [
  { id: 'av_1', doctorId: 'doc_1', dayOfWeek: 1, startTime: '08:00', endTime: '17:00', slotDurationMinutes: 30 },
  { id: 'av_2', doctorId: 'doc_2', dayOfWeek: 1, startTime: '09:00', endTime: '16:00', slotDurationMinutes: 30 },
  { id: 'av_3', doctorId: 'doc_1', dayOfWeek: 2, startTime: '08:00', endTime: '17:00', slotDurationMinutes: 30 },
  { id: 'av_4', doctorId: 'doc_2', dayOfWeek: 2, startTime: '09:00', endTime: '16:00', slotDurationMinutes: 30 },
  { id: 'av_5', doctorId: 'doc_1', dayOfWeek: 3, startTime: '08:00', endTime: '17:00', slotDurationMinutes: 30 },
  { id: 'av_6', doctorId: 'doc_2', dayOfWeek: 3, startTime: '09:00', endTime: '16:00', slotDurationMinutes: 30 },
  { id: 'av_7', doctorId: 'doc_1', dayOfWeek: 4, startTime: '08:00', endTime: '17:00', slotDurationMinutes: 30 },
  { id: 'av_8', doctorId: 'doc_2', dayOfWeek: 4, startTime: '09:00', endTime: '16:00', slotDurationMinutes: 30 },
  { id: 'av_9', doctorId: 'doc_1', dayOfWeek: 5, startTime: '08:00', endTime: '17:00', slotDurationMinutes: 30 },
  { id: 'av_10', doctorId: 'doc_2', dayOfWeek: 5, startTime: '09:00', endTime: '16:00', slotDurationMinutes: 30 },
]

export const appointments: Appointment[] = [
  { id: 'apt_1', doctorId: 'doc_1', patientName: 'Grace Njeri', patientPhone: '+254722111001', startTime: `${base}T08:00:00`, endTime: `${base}T08:30:00`, status: 'completed', source: 'phone', notes: 'Follow-up', consentCaptured: true, reminderStatuses: ['delivered', 'delivered'], createdAt: now, statusChangedAt: now },
  { id: 'apt_2', doctorId: 'doc_1', patientName: 'Samuel Kiptoo', patientPhone: '+254722111002', startTime: `${base}T09:00:00`, endTime: `${base}T09:30:00`, status: 'confirmed', source: 'phone', consentCaptured: true, reminderStatuses: ['delivered', 'sent'], createdAt: now, statusChangedAt: now },
  { id: 'apt_3', doctorId: 'doc_2', patientName: 'Faith Achieng', patientPhone: '+254722111003', startTime: `${base}T09:30:00`, endTime: `${base}T10:00:00`, status: 'scheduled', source: 'manual', notes: 'Child vaccination review', consentCaptured: true, reminderStatuses: ['sent', 'queued'], createdAt: now, statusChangedAt: now },
  { id: 'apt_4', doctorId: 'doc_1', patientName: 'Peter Mwangi', patientPhone: '+254722111004', startTime: `${base}T10:30:00`, endTime: `${base}T11:00:00`, status: 'no_show', source: 'phone', consentCaptured: true, reminderStatuses: ['delivered', 'delivered'], createdAt: now, statusChangedAt: now },
  { id: 'apt_5', doctorId: 'doc_2', patientName: 'Mary Wambui', patientPhone: '+254722111005', startTime: `${base}T11:00:00`, endTime: `${base}T11:30:00`, status: 'scheduled', source: 'walk_in', consentCaptured: false, reminderStatuses: ['queued', 'queued'], createdAt: now, statusChangedAt: now },
  { id: 'apt_6', doctorId: 'doc_1', patientName: 'John Kamau', patientPhone: '+254722111006', startTime: `${base}T14:00:00`, endTime: `${base}T14:30:00`, status: 'cancelled', source: 'phone', cancelReason: 'Patient called to cancel', notes: 'Patient called to cancel', consentCaptured: true, reminderStatuses: ['delivered', 'failed'], createdAt: now, statusChangedAt: now },
]