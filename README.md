# Clinic Reminder

Monorepo for the Clinic Reminder MVP: a receptionist-first scheduling, SMS reminder, and no-show tracking app for small private Kenyan clinics.

## Structure

- `frontend/` - Vite + React + TypeScript + Tailwind frontend
- `backend/` - Django + Django REST Framework API (PostgreSQL-ready, SQLite fallback for local dev)

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs at `http://127.0.0.1:5173/`.

## Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python manage.py migrate
python manage.py seed_demo
python manage.py runserver 127.0.0.1:8000
```

API runs at `http://127.0.0.1:8000/api/`. Admin at `http://127.0.0.1:8000/admin/`. Create an account from the frontend sign-up flow, or create a Django superuser with `python manage.py createsuperuser`.

## Notes

- Backend uses `DATABASE_URL`; defaults to SQLite if unset. Set PostgreSQL via `.env` for production-aligned storage.
- Frontend API base defaults to `http://127.0.0.1:8000/api` (`VITE_API_URL` can override).
- Demo data is seeded by `python manage.py seed_demo`.