import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from './App'

vi.mock('./lib/api', async () => {
  const { appointments, availabilityRules, clinic, doctors } = await import('./lib/mock')
  let c = structuredClone(clinic)
  let d = structuredClone(doctors)
  let r = structuredClone(availabilityRules)
  let a = structuredClone(appointments)
  return {
    authToken: {
      get: () => localStorage.getItem('clinic-reminder-token'),
      set: (t: string) => localStorage.setItem('clinic-reminder-token', t),
      clear: () => localStorage.removeItem('clinic-reminder-token'),
    },
    api: {
      getClinic: async () => c,
      updateClinic: async (_id: string, patch: any) => { c = { ...c, ...patch }; return c },
      getDoctors: async () => d,
      addDoctor: async (_cid: string, doc: any) => { const n = { ...doc, id: `doc_${Date.now()}` }; d = [...d, n]; return n },
      updateDoctor: async (id: string, patch: any) => { d = d.map((x: any) => x.id === id ? { ...x, ...patch } : x); return d.find((x: any) => x.id === id) },
      getRules: async () => r,
      addRule: async (rule: any) => { const n = { ...rule, id: `av_${Date.now()}` }; r = [...r, n]; return n },
      removeRule: async (id: string) => { r = r.filter((x: any) => x.id !== id) },
      getAppointments: async () => a,
      addAppointment: async (_cid: string, appt: any) => { const n = { ...appt, id: `apt_${Date.now()}` }; a = [...a, n]; return n },
      updateAppointment: async (id: string, patch: any) => { a = a.map((x: any) => x.id === id ? { ...x, ...patch } : x); return a.find((x: any) => x.id === id) },
    },
  }
})

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem('clinic-reminder-token', 'test-token')
})

afterEach(() => {
  cleanup()
})

test('dashboard renders key stats and appointments', async () => {
  render(<App />)
  expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
  expect(screen.getByText("Today's appointments")).toBeInTheDocument()
  expect(screen.getByText('No-show rate')).toBeInTheDocument()
  expect(screen.getByText('Grace Njeri')).toBeInTheDocument()
})

test('can navigate to appointments and create booking', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(screen.getAllByRole('link', { name: /Appointments/i })[0])
  expect(screen.getByRole('heading', { name: 'Appointments' })).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: /New appointment/i }))
  await user.type(screen.getByLabelText('Patient name'), 'Test Patient')
  await user.clear(screen.getByLabelText('Patient phone (E.164)'))
  await user.type(screen.getByLabelText('Patient phone (E.164)'), '+254700000111')

  // pick a weekday with availability rules (Mon)
  const dateInputs = screen.getAllByLabelText('Date')
  await user.clear(dateInputs[0])
  await user.type(dateInputs[0], '2026-11-23')

  const slotButtons = screen.getAllByRole('button').filter((b) => /^\d{2}:\d{2}$/.test(b.textContent || ''))
  expect(slotButtons.length).toBeGreaterThan(0)
  await user.click(slotButtons[0])

  await user.click(screen.getByLabelText(/Patient consents/i))
  await user.click(screen.getByRole('button', { name: 'Save appointment' }))

  // form closes; filter by the appointment date to confirm it appears
  const filterDate = screen.getByLabelText('Date')
  await user.clear(filterDate)
  await user.type(filterDate, '2026-11-23')
  expect(screen.getByText('Test Patient')).toBeInTheDocument()
})

test('settings renders and can add doctor', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(screen.getAllByRole('link', { name: /Settings/i })[0])
  expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument()
  expect(screen.getByText('Clinic profile')).toBeInTheDocument()

  await user.type(screen.getByPlaceholderText('Name'), 'Dr. Test')
  await user.type(screen.getByPlaceholderText('Specialty'), 'Dental')
  await user.clear(screen.getByPlaceholderText('Phone'))
  await user.type(screen.getByPlaceholderText('Phone'), '+254700000222')
  await user.click(screen.getByRole('button', { name: 'Add doctor' }))
  expect((await screen.findAllByText('Dr. Test')).length).toBeGreaterThan(0)
})