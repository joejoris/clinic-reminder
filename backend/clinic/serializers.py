from rest_framework import serializers

from .models import Appointment, AppointmentReminder, AvailabilityException, AvailabilityRule, Clinic, Doctor, StaffUser


class ClinicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Clinic
        fields = '__all__'


class StaffUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = StaffUser
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'phone', 'role', 'active', 'clinic', 'password', 'is_staff']
        read_only_fields = ['is_staff']

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = StaffUser(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()
        return user


class DoctorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Doctor
        fields = '__all__'


class AvailabilityRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = AvailabilityRule
        fields = '__all__'


class AvailabilityExceptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AvailabilityException
        fields = '__all__'


class AppointmentReminderSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppointmentReminder
        fields = '__all__'


class AppointmentSerializer(serializers.ModelSerializer):
    reminders = AppointmentReminderSerializer(many=True, read_only=True)
    doctor_name = serializers.CharField(source='doctor.name', read_only=True)

    class Meta:
        model = Appointment
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'status_changed_at']

    def validate(self, attrs):
        instance = getattr(self, 'instance', None)
        doctor = attrs.get('doctor', instance.doctor if instance else None)
        start = attrs.get('start_time', instance.start_time if instance else None)
        end = attrs.get('end_time', instance.end_time if instance else None)
        status = attrs.get('status', instance.status if instance else 'scheduled')
        if start and end and end <= start:
            raise serializers.ValidationError({'end_time': 'End time must be after start time.'})
        if doctor and start and end and status != 'cancelled':
            qs = Appointment.objects.filter(doctor=doctor, status__in=['scheduled', 'confirmed', 'completed', 'no_show'])
            if instance:
                qs = qs.exclude(pk=instance.pk)
            if qs.filter(start_time__lt=end, end_time__gt=start).exists():
                raise serializers.ValidationError('This slot overlaps an existing appointment for the selected doctor.')
        return attrs