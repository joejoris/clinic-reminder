import { useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { authToken } from './lib/api'
import { StoreProvider } from './lib/store'
import { Appointments } from './pages/Appointments'
import { Dashboard } from './pages/Dashboard'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Settings } from './pages/Settings'

export default function App() {
  const [authed, setAuthed] = useState(!!authToken.get())
  const onAuth = () => setAuthed(true)
  const onLogout = () => { authToken.clear(); setAuthed(false) }

  return (
    <BrowserRouter>
      {authed ? (
        <StoreProvider>
          <Routes>
            <Route element={<Layout onLogout={onLogout} />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/appointments" element={<Appointments />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </StoreProvider>
      ) : (
        <Routes>
          <Route path="/login" element={<Login onAuth={onAuth} />} />
          <Route path="/register" element={<Register onAuth={onAuth} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      )}
    </BrowserRouter>
  )
}