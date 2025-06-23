# users/serializers.py

from rest_framework import serializers
from .models import NewUser


class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewUser
        fields = [
            'id',
            'email',
            'username',
            'avatar',
            'xp',
            'level',
            'is_staff',
            'date_joined',
        ]
        read_only_fields = ['id', 'xp', 'level', 'is_staff', 'date_joined']


class UpdateProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewUser
        fields = ['username', 'avatar']

class PublicUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewUser
        fields = ['username', 'avatar', 'xp', 'level']