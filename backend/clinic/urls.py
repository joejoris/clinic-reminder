from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AppointmentReminderViewSet,
    AppointmentViewSet,
    AvailabilityExceptionViewSet,
    AvailabilityRuleViewSet,
    ClinicViewSet,
    DoctorViewSet,
    StaffUserViewSet,
    login,
    me,
    register,
)

router = DefaultRouter()
router.register(r'clinics', ClinicViewSet)
router.register(r'staff', StaffUserViewSet)
router.register(r'doctors', DoctorViewSet, basename='doctor')
router.register(r'availability-rules', AvailabilityRuleViewSet, basename='availabilityrule')
router.register(r'availability-exceptions', AvailabilityExceptionViewSet, basename='availabilityexception')
router.register(r'appointments', AppointmentViewSet, basename='appointment')
router.register(r'reminders', AppointmentReminderViewSet, basename='reminder')

urlpatterns = [
    path('auth/register/', register),
    path('auth/login/', login),
    path('auth/me/', me),
    path('', include(router.urls)),
]