from datetime import datetime

from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Appointment, AppointmentReminder, AvailabilityException, AvailabilityRule, Clinic, Doctor, StaffUser
from .serializers import (
    AppointmentReminderSerializer,
    AppointmentSerializer,
    AvailabilityExceptionSerializer,
    AvailabilityRuleSerializer,
    ClinicSerializer,
    DoctorSerializer,
    StaffUserSerializer,
)


class ClinicViewSet(viewsets.ModelViewSet):
    queryset = Clinic.objects.all().order_by('id')
    serializer_class = ClinicSerializer


class StaffUserViewSet(viewsets.ModelViewSet):
    queryset = StaffUser.objects.all().order_by('id')
    serializer_class = StaffUserSerializer


class DoctorViewSet(viewsets.ModelViewSet):
    serializer_class = DoctorSerializer

    def get_queryset(self):
        qs = Doctor.objects.all().order_by('id')
        clinic = self.request.query_params.get('clinic')
        if clinic:
            qs = qs.filter(clinic_id=clinic)
        return qs


class AvailabilityRuleViewSet(viewsets.ModelViewSet):
    serializer_class = AvailabilityRuleSerializer

    def get_queryset(self):
        qs = AvailabilityRule.objects.select_related('doctor').all()
        doctor = self.request.query_params.get('doctor')
        clinic = self.request.query_params.get('clinic')
        if doctor:
            qs = qs.filter(doctor_id=doctor)
        if clinic:
            qs = qs.filter(doctor__clinic_id=clinic)
        return qs


class AvailabilityExceptionViewSet(viewsets.ModelViewSet):
    serializer_class = AvailabilityExceptionSerializer

    def get_queryset(self):
        qs = AvailabilityException.objects.all()
        clinic = self.request.query_params.get('clinic')
        doctor = self.request.query_params.get('doctor')
        if clinic:
            qs = qs.filter(clinic_id=clinic)
        if doctor:
            qs = qs.filter(doctor_id=doctor)
        return qs


class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer

    def get_queryset(self):
        qs = Appointment.objects.select_related('doctor', 'clinic').prefetch_related('reminders').all()
        clinic = self.request.query_params.get('clinic')
        doctor = self.request.query_params.get('doctor')
        date = self.request.query_params.get('date')
        status = self.request.query_params.get('status')
        if clinic:
            qs = qs.filter(clinic_id=clinic)
        if doctor:
            qs = qs.filter(doctor_id=doctor)
        if status:
            qs = qs.filter(status=status)
        if date:
            qs = qs.filter(start_time__date=date)
        return qs

    def perform_update(self, serializer):
        instance = serializer.instance
        new_status = serializer.validated_data.get('status', instance.status)
        extra = {}
        if new_status != instance.status:
            extra['status_changed_at'] = timezone.now()
        serializer.save(**extra)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        clinic = request.query_params.get('clinic')
        date = request.query_params.get('date')
        qs = Appointment.objects.all()
        if clinic:
            qs = qs.filter(clinic_id=clinic)
        if date:
            qs = qs.filter(start_time__date=date)
        totals = qs.aggregate(
            total=Count('id'),
            completed=Count('id', filter=Q(status='completed')),
            no_show=Count('id', filter=Q(status='no_show')),
            cancelled=Count('id', filter=Q(status='cancelled')),
            confirmed=Count('id', filter=Q(status='confirmed')),
            scheduled=Count('id', filter=Q(status='scheduled')),
        )
        reminders_sent = AppointmentReminder.objects.filter(appointment__in=qs, delivery_status__in=['sent', 'delivered']).count()
        return Response({**totals, 'reminders_sent': reminders_sent})


class AppointmentReminderViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentReminderSerializer

    def get_queryset(self):
        qs = AppointmentReminder.objects.select_related('appointment', 'clinic').all()
        clinic = self.request.query_params.get('clinic')
        appointment = self.request.query_params.get('appointment')
        if clinic:
            qs = qs.filter(clinic_id=clinic)
        if appointment:
            qs = qs.filter(appointment_id=appointment)
        return qs