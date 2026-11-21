export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'no_show' | 'cancelled'

export type ReminderStatus = 'queued' | 'sent' | 'delivered' | 'failed' | 'opted_out'

export interface Doctor {
  id: string
  name: string
  specialty: string
  phone: string
  active: boolean
}

export interface AvailabilityRule {
  id: string
  doctorId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  slotDurationMinutes: number
}

export interface Appointment {
  id: string
  doctorId: string
  patientName: string
  patientPhone: string
  startTime: string
  endTime: string
  status: AppointmentStatus
  source: 'phone' | 'walk_in' | 'manual'
  notes?: string
  cancelReason?: string
  consentCaptured: boolean
  reminderStatuses: ReminderStatus[]
  createdAt: string
  statusChangedAt: string
}

export interface Clinic {
  id: string
  name: string
  county: string
  timezone: string
  reminderHours: number[]
}