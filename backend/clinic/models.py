from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models import Q, F


class Clinic(models.Model):
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=32, blank=True)
    county = models.CharField(max_length=100, blank=True)
    timezone = models.CharField(max_length=64, default='Africa/Nairobi')
    subscription_status = models.CharField(max_length=32, default='trial')
    billing_contact_phone = models.CharField(max_length=32, blank=True)
    sms_sender_id = models.CharField(max_length=32, blank=True)
    reminder_hours = models.JSONField(default=list)  # e.g. [24, 2]
    consent_text_version = models.CharField(max_length=32, default='v1')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class StaffUser(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = 'admin', 'Admin'
        RECEPTIONIST = 'receptionist', 'Receptionist'
        DOCTOR = 'doctor', 'Doctor'

    clinic = models.ForeignKey(Clinic, on_delete=models.CASCADE, related_name='staff', null=True, blank=True)
    phone = models.CharField(max_length=32, blank=True)
    role = models.CharField(max_length=32, choices=Role.choices, default=Role.RECEPTIONIST)
    active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.role})"


class Doctor(models.Model):
    clinic = models.ForeignKey(Clinic, on_delete=models.CASCADE, related_name='doctors')
    name = models.CharField(max_length=255)
    specialty = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=32, blank=True)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class AvailabilityRule(models.Model):
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='availability_rules')
    day_of_week = models.PositiveSmallIntegerField()  # 0=Sun..6=Sat
    start_time = models.TimeField()
    end_time = models.TimeField()
    slot_duration_minutes = models.PositiveSmallIntegerField(default=30)
    effective_from = models.DateField(null=True, blank=True)
    effective_to = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['doctor', 'day_of_week', 'start_time']

    def __str__(self):
        return f"{self.doctor} {self.day_of_week} {self.start_time}-{self.end_time}"


class AvailabilityException(models.Model):
    class Type(models.TextChoices):
        CLOSED = 'closed', 'Closed'
        UNAVAILABLE = 'unavailable', 'Unavailable'
        EXTRA_HOURS = 'extra_hours', 'Extra hours'

    clinic = models.ForeignKey(Clinic, on_delete=models.CASCADE, related_name='availability_exceptions')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='availability_exceptions', null=True, blank=True)
    date = models.DateField()
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    type = models.CharField(max_length=32, choices=Type.choices)
    reason = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class Appointment(models.Model):
    class Status(models.TextChoices):
        SCHEDULED = 'scheduled', 'Scheduled'
        CONFIRMED = 'confirmed', 'Confirmed'
        COMPLETED = 'completed', 'Completed'
        NO_SHOW = 'no_show', 'No show'
        CANCELLED = 'cancelled', 'Cancelled'

    class Source(models.TextChoices):
        PHONE = 'phone', 'Phone'
        WALK_IN = 'walk_in', 'Walk-in'
        MANUAL = 'manual', 'Manual'
        WHATSAPP = 'whatsapp', 'WhatsApp'

    clinic = models.ForeignKey(Clinic, on_delete=models.CASCADE, related_name='appointments')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='appointments')
    patient_name = models.CharField(max_length=255)
    patient_phone_e164 = models.CharField(max_length=32)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    status = models.CharField(max_length=32, choices=Status.choices, default=Status.SCHEDULED)
    source = models.CharField(max_length=32, choices=Source.choices, default=Source.PHONE)
    notes = models.TextField(blank=True)
    cancel_reason = models.CharField(max_length=255, blank=True)
    consent_captured_at = models.DateTimeField(null=True, blank=True)
    consent_channel = models.CharField(max_length=32, blank=True)
    created_by = models.ForeignKey(StaffUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_appointments')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    status_changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['start_time']
        constraints = [
            models.CheckConstraint(condition=Q(end_time__gt=F('start_time')), name='appointment_end_after_start'),
        ]

    def __str__(self):
        return f"{self.patient_name} @ {self.start_time}"


class AppointmentReminder(models.Model):
    class Channel(models.TextChoices):
        SMS = 'sms', 'SMS'
        WHATSAPP = 'whatsapp', 'WhatsApp'

    class ReminderType(models.TextChoices):
        BOOKING_CONFIRMATION = 'booking_confirmation', 'Booking confirmation'
        H24 = '24h', '24 hours'
        H2 = '2h', '2 hours'
        MANUAL = 'manual', 'Manual'

    class DeliveryStatus(models.TextChoices):
        QUEUED = 'queued', 'Queued'
        SENT = 'sent', 'Sent'
        DELIVERED = 'delivered', 'Delivered'
        FAILED = 'failed', 'Failed'
        OPTED_OUT = 'opted_out', 'Opted out'
        UNKNOWN = 'unknown', 'Unknown'

    appointment = models.ForeignKey(Appointment, on_delete=models.CASCADE, related_name='reminders')
    clinic = models.ForeignKey(Clinic, on_delete=models.CASCADE, related_name='reminders')
    channel = models.CharField(max_length=32, choices=Channel.choices, default=Channel.SMS)
    reminder_type = models.CharField(max_length=32, choices=ReminderType.choices)
    scheduled_for = models.DateTimeField()
    sent_at = models.DateTimeField(null=True, blank=True)
    provider = models.CharField(max_length=64, blank=True)
    provider_message_id = models.CharField(max_length=255, blank=True)
    delivery_status = models.CharField(max_length=32, choices=DeliveryStatus.choices, default=DeliveryStatus.QUEUED)
    reply_payload = models.JSONField(null=True, blank=True)
    error_message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['scheduled_for']