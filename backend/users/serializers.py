from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ('user_id', 'name', 'email', 'password', 'confirm_password')
        extra_kwargs = {
            'email': {'required': True},
            'name': {'required': True},
        }

    def validate_email(self, value):
        normalized_email = value.strip().lower()
        if User.objects.filter(email=normalized_email).exists():
            raise serializers.ValidationError('A user with this email address already exists.')
        return normalized_email

    def validate(self, attrs):
        if attrs.get('password') != attrs.get('confirm_password'):
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)
        return user


class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get('email', '').strip().lower()
        password = attrs.get('password', '')

        if not email or not password:
            raise serializers.ValidationError('Both email and password are required.')

        user = authenticate(email=email, password=password)
        if not user:
            # Check if email exists
            if not User.objects.filter(email=email).exists():
                raise serializers.ValidationError('No account found with this email.')
            raise serializers.ValidationError('Incorrect password.')

        if not user.is_active:
            raise serializers.ValidationError('This account has been deactivated.')

        attrs['user'] = user
        return attrs


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('user_id', 'name', 'email', 'created_at')
        read_only_fields = ('user_id', 'created_at')
