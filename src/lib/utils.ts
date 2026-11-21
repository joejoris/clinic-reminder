import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-KE', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-KE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

export function formatPhone(phone: string) {
  return phone
}

export function statusLabel(status: string) {
  return status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}