from rest_framework import serializers
from .models import PaymentProof


class PaymentProofSerializer(serializers.ModelSerializer):
    total_gold_with_bonus = serializers.ReadOnlyField()
    
    class Meta:
        model = PaymentProof
        fields = [
            'id',
            'payment_reference',
            'package_amount',
            'package_price',
            'bonus',
            'total_gold_with_bonus',
            'status',
            'created_at',
            'verified_at',
            'verification_notes'
        ]
        read_only_fields = ['id', 'status', 'created_at', 'verified_at', 'verification_notes']


class PaymentProofSubmissionSerializer(serializers.ModelSerializer):
    receipt = serializers.ImageField(write_only=True, source='receipt_image')
    
    class Meta:
        model = PaymentProof
        fields = [
            'payment_reference',
            'package_amount',
            'package_price',
            'bonus',
            'receipt'
        ]
    
    def validate_payment_reference(self, value):
        """Ensure payment reference is unique"""
        if PaymentProof.objects.filter(payment_reference=value).exists():
            raise serializers.ValidationError("A payment with this reference already exists.")
        return value
    
    def validate_receipt(self, value):
        """Validate receipt image"""
        if value.size > 5 * 1024 * 1024:  # 5MB limit
            raise serializers.ValidationError("Image size must be less than 5MB.")
        
        if not value.content_type.startswith('image/'):
            raise serializers.ValidationError("File must be an image.")
        
        return value
