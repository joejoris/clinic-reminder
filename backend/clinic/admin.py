from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Appointment, AppointmentReminder, AvailabilityException, AvailabilityRule, Clinic, Doctor, StaffUser


@admin.register(StaffUser)
class StaffUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (('Clinic', {'fields': ('clinic', 'phone', 'role', 'active')}),)
    list_display = ('username', 'email', 'clinic', 'role', 'active', 'is_staff')


admin.site.register(Clinic)
admin.site.register(Doctor)
admin.site.register(AvailabilityRule)
admin.site.register(AvailabilityException)
admin.site.register(Appointment)
admin.site.register(AppointmentReminder)