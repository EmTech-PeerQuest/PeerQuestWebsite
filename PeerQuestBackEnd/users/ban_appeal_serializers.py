from rest_framework import serializers
from .models import BanAppeal, BanAppealFile


# Nested serializer for files
class BanAppealFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = BanAppealFile
        fields = ['id', 'file', 'uploaded_at']

class BanAppealSerializer(serializers.ModelSerializer):
    files = BanAppealFileSerializer(many=True, read_only=True)
    ban_reason = serializers.SerializerMethodField()
    ban_expires_at = serializers.SerializerMethodField()
    user_email = serializers.SerializerMethodField()

    class Meta:
        model = BanAppeal
        fields = [
            'id', 'user_email', 'message', 'files', 'created_at',
            'reviewed', 'reviewed_by', 'review_decision', 'review_comment', 'reviewed_at',
            'ban_reason', 'ban_expires_at'
        ]
        read_only_fields = ['id', 'user_email', 'created_at', 'reviewed', 'reviewed_by', 'review_decision', 'review_comment', 'reviewed_at', 'ban_reason', 'ban_expires_at']

    def get_ban_reason(self, obj):
        return getattr(obj.user, 'ban_reason', None)

    def get_ban_expires_at(self, obj):
        return getattr(obj.user, 'ban_expires_at', None)

    def get_user_email(self, obj):
        return getattr(obj.user, 'email', None)
