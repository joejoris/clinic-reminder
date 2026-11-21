from datetime import datetime

from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from django.contrib.auth import authenticate

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

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    data = request.data
    clinic_name = (data.get('clinic_name') or '').strip()
    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip().lower()
    username = (data.get('username') or email or '').strip().lower()
    password = data.get('password') or ''
    phone = (data.get('phone') or '').strip()
    if not clinic_name or not username or not password:
        return Response({'detail': 'clinic_name, username/email, and password are required.'}, status=status.HTTP_400_BAD_REQUEST)
    if StaffUser.objects.filter(username=username).exists():
        return Response({'detail': 'Username already exists.'}, status=status.HTTP_400_BAD_REQUEST)
    clinic = Clinic.objects.create(name=clinic_name, phone=phone, reminder_hours=[24, 2])
    user = StaffUser.objects.create_user(username=username, email=email, password=password, first_name=name, phone=phone, role='admin', clinic=clinic, is_staff=True)
    token, _ = Token.objects.get_or_create(user=user)
    return Response({'token': token.key, 'user': StaffUserSerializer(user).data, 'clinic': ClinicSerializer(clinic).data}, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    username = (request.data.get('username') or request.data.get('email') or '').strip().lower()
    password = request.data.get('password') or ''
    user = authenticate(request, username=username, password=password)
    if not user:
        # try email lookup
        try:
            u = StaffUser.objects.get(email=username)
            user = authenticate(request, username=u.username, password=password)
        except StaffUser.DoesNotExist:
            pass
    if not user:
        return Response({'detail': 'Invalid credentials.'}, status=status.HTTP_400_BAD_REQUEST)
    token, _ = Token.objects.get_or_create(user=user)
    return Response({'token': token.key, 'user': StaffUserSerializer(user).data, 'clinic': ClinicSerializer(user.clinic).data if user.clinic else None})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    u = request.user
    return Response({'user': StaffUserSerializer(u).data, 'clinic': ClinicSerializer(u.clinic).data if u.clinic else None})
