# Clinic Reminder Backend

Django + Django REST Framework backend for the Clinic Reminder MVP.

## Stack

- Python / Django / DRF
- PostgreSQL-ready via `DATABASE_URL` (falls back to SQLite for local dev)
- CORS enabled for frontend (`http://127.0.0.1:5173`)

## Setup

```bash
cd C:\Users\JORIS\clinic-reminder-backend
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env  # optional; set DATABASE_URL for PostgreSQL
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 127.0.0.1:8000
```

## PostgreSQL

Set in `.env`:

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/clinic_reminder
```

## API Endpoints

- `GET/POST /api/clinics/`
- `GET/POST /api/staff/`
- `GET/POST /api/doctors/?clinic=1`
- `GET/POST /api/availability-rules/?clinic=1&doctor=1`
- `GET/POST /api/availability-exceptions/?clinic=1`
- `GET/POST /api/appointments/?clinic=1&date=YYYY-MM-DD&doctor=1`
- `GET /api/appointments/stats/?clinic=1&date=YYYY-MM-DD`
- `GET/POST /api/reminders/?clinic=1&appointment=1`
- `POST/PUT/PATCH/DELETE` supported on detail routes, e.g. `/api/appointments/1/`

## Notes

- Auth is currently open (`AllowAny`) for MVP scaffolding; add JWT/session auth and clinic scoping before production.
- Double-booking prevention should be enforced at DB/service layer for production (constraint/transaction logic). Current model includes `end_time > start_time` check.