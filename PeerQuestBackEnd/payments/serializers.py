from rest_framework import serializers
from .models import PaymentProof, GoldPackage


class GoldPackageSerializer(serializers.ModelSerializer):
    """Serializer for gold packages"""
    total_gold = serializers.ReadOnlyField()
    formatted_bonus = serializers.ReadOnlyField()
    
    class Meta:
        model = GoldPackage
        fields = [
            'id',
            'name',
            'gold_amount',
            'price_php',
            'bonus_gold',
            'bonus_description',
            'total_gold',
            'formatted_bonus',
            'is_active'
        ]


class PaymentProofSerializer(serializers.ModelSerializer):
    total_gold_with_bonus = serializers.ReadOnlyField()
    user = serializers.SerializerMethodField()
    receipt_image = serializers.SerializerMethodField()
    gold_package_info = serializers.SerializerMethodField()
    
    class Meta:
        model = PaymentProof
        fields = [
            'id',
            'user',
            'payment_reference',
            'gold_package',
            'gold_package_info',
            'package_amount',
            'package_price',
            'bonus',
            'total_gold_with_bonus',
            'receipt_image',
            'status',
            'batch_id',
            'scheduled_batch',
            'next_processing_time',
            'verified_by',
            'verification_notes',
            'created_at',
            'verified_at',
            'processed_at'
        ]
        read_only_fields = [
            'id', 'status', 'batch_id', 'scheduled_batch', 'next_processing_time',
            'verified_by', 'created_at', 'verified_at', 'processed_at',
            'package_amount', 'package_price', 'bonus'  # These are auto-filled from gold_package
        ]
    
    def get_user(self, obj):
        """Return user info"""
        if obj.user:
            return {
                'id': obj.user.id,
                'username': obj.user.username,
                'email': obj.user.email
            }
        return None
    
    def get_receipt_image(self, obj):
        """Return full URL for receipt image"""
        if obj.receipt_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.receipt_image.url)
            return obj.receipt_image.url
        return None
    
    def get_gold_package_info(self, obj):
        """Return gold package information"""
        if obj.gold_package:
            return GoldPackageSerializer(obj.gold_package).data
        return None


class PaymentProofSubmissionSerializer(serializers.ModelSerializer):
    receipt = serializers.ImageField(write_only=True, source='receipt_image')
    
    class Meta:
        model = PaymentProof
        fields = [
            'payment_reference',
            'gold_package',
            'receipt'
        ]
    
    def validate_payment_reference(self, value):
        """Ensure payment reference is unique"""
        if PaymentProof.objects.filter(payment_reference=value).exists():
            raise serializers.ValidationError("A payment with this reference already exists.")
        return value
    
    def validate_gold_package(self, value):
        """Ensure gold package is active"""
        if not value.is_active:
            raise serializers.ValidationError("This gold package is no longer available.")
        return value
    
    def validate_receipt(self, value):
        """Validate receipt image"""
        if value.size > 5 * 1024 * 1024:  # 5MB limit
            raise serializers.ValidationError("Image size must be less than 5MB.")
        
        if not value.content_type.startswith('image/'):
            raise serializers.ValidationError("File must be an image.")
        
        return value
    
    def create(self, validated_data):
        """Create payment proof and auto-fill package details"""
        gold_package = validated_data['gold_package']
        
        # Auto-fill the package details from the selected gold package
        validated_data['package_amount'] = gold_package.gold_amount
        validated_data['package_price'] = gold_package.price_php
        validated_data['bonus'] = gold_package.formatted_bonus
        
        return super().create(validated_data)
