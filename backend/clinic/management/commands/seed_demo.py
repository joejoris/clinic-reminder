from datetime import datetime, timedelta, time

from django.core.management.base import BaseCommand
from django.utils import timezone

from clinic.models import Appointment, AvailabilityRule, Clinic, Doctor, StaffUser


class Command(BaseCommand):
    help = 'Seed demo clinic data'

    def handle(self, *args, **options):
        if Clinic.objects.filter(name='Majiwa Family Clinic').exists():
            self.stdout.write(self.style.WARNING('Demo data already exists.'))
            return

        clinic = Clinic.objects.create(
            name='Majiwa Family Clinic', phone='+254700000000', county='Nairobi',
            timezone='Africa/Nairobi', subscription_status='trial', sms_sender_id='CLINIC',
            reminder_hours=[24, 2], consent_text_version='v1',
        )

        d1 = Doctor.objects.create(clinic=clinic, name='Dr. Amina Wanjiku', specialty='General Practice', phone='+254712000001')
        d2 = Doctor.objects.create(clinic=clinic, name='Dr. Brian Otieno', specialty='Pediatrics', phone='+254712000002')
        for doc in [d1, d2]:
            for day in range(1, 6):
                AvailabilityRule.objects.create(doctor=doc, day_of_week=day, start_time=time(8, 0), end_time=time(17, 0), slot_duration_minutes=30)

        today = timezone.localdate()
        base = datetime.combine(today, time(0, 0))
        aware = timezone.get_current_timezone()
        def at(h, m):
            return timezone.make_aware(datetime.combine(today, time(h, m)), aware)
        samples = [
            (d1, 'Grace Njeri', '+254722111001', 8, 0, 'completed', 'phone', True),
            (d1, 'Samuel Kiptoo', '+254722111002', 9, 0, 'confirmed', 'phone', True),
            (d2, 'Faith Achieng', '+254722111003', 9, 30, 'scheduled', 'manual', True),
            (d1, 'Peter Mwangi', '+254722111004', 10, 30, 'no_show', 'phone', True),
            (d2, 'Mary Wambui', '+254722111005', 11, 0, 'scheduled', 'walk_in', False),
            (d1, 'John Kamau', '+254722111006', 14, 0, 'cancelled', 'phone', True),
        ]
        for doc, name, phone, h, m, status, source, consent in samples:
            start = at(h, m)
            Appointment.objects.create(
                clinic=clinic, doctor=doc, patient_name=name, patient_phone_e164=phone,
                start_time=start, end_time=start + timedelta(minutes=30), status=status, source=source,
                consent_captured_at=timezone.now() if consent else None, consent_channel='sms' if consent else '',
                cancel_reason='Patient called to cancel' if status == 'cancelled' else '',
            )
        self.stdout.write(self.style.SUCCESS(f'Seeded demo clinic id={clinic.id}'))