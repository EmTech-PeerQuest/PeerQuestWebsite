from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.contrib import messages
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import PaymentProof, GoldPackage

User = get_user_model()


@admin.register(PaymentProof)
class PaymentProofAdmin(admin.ModelAdmin):
    list_display = [
        'payment_reference', 
        'user', 
        'gold_package',
        'receipt_preview',  # Move receipt preview earlier for visibility
        'package_price', 
        'package_amount', 
        'total_gold_display',
        'status',
        'approval_type_display',
        'batch_info_display',
        'created_at'
    ]
    list_filter = ['status', 'scheduled_batch', 'created_at', 'gold_package', 'batch_id']
    search_fields = ['payment_reference', 'user__username', 'user__email', 'gold_package__name']
    readonly_fields = [
        'payment_reference', 
        'package_amount',  # Auto-filled from gold_package
        'package_price',   # Auto-filled from gold_package
        'bonus',           # Auto-filled from gold_package
        'created_at', 
        'verified_at', 
        'processed_at', 
        'receipt_preview_large', 
        'batch_id', 
        'next_processing_time'
    ]
    
    fieldsets = [
        ('Package Selection', {
            'fields': [
                'user', 
                'payment_reference', 
                'gold_package',  # Main field for selecting package
                'created_at'
            ]
        }),
        ('Package Details (Auto-filled)', {
            'fields': [
                'package_amount', 
                'package_price', 
                'bonus'
            ],
            'classes': ['collapse'],
            'description': 'These fields are automatically filled based on the selected gold package.'
        }),
        ('Batch Processing', {
            'fields': [
                'batch_id',
                'scheduled_batch',
                'next_processing_time',
                'processed_at'
            ]
        }),
        ('Receipt', {
            'fields': ['receipt_image', 'receipt_preview_large']
        }),
        ('Verification', {
            'fields': [
                'status', 
                'verified_by', 
                'verification_notes',
                'verified_at'
            ]
        }),
    ]
    
    actions = ['verify_payments', 'reject_payments', 'start_batch_processing', 'assign_to_next_batch']

    def batch_info_display(self, obj):
        """Display batch information in a clear, readable format"""
        if obj.scheduled_batch and obj.next_processing_time:
            from django.utils import timezone
            
            # Convert to local timezone for display
            local_time = timezone.localtime(obj.next_processing_time)
            
            # Format the batch time for better readability
            batch_date = local_time.strftime('%b %d, %Y')  # Jan 06, 2025
            batch_time = local_time.strftime('%I:%M %p')   # 02:00 PM
            batch_name = obj.get_scheduled_batch_display()
            
            # Check if batch is overdue
            now = timezone.now()
            if obj.next_processing_time < now:
                # Calculate overdue time
                overdue_delta = now - obj.next_processing_time
                overdue_hours = int(overdue_delta.total_seconds() // 3600)
                if overdue_hours > 24:
                    overdue_days = overdue_hours // 24
                    overdue_text = f"{overdue_days}d overdue"
                else:
                    overdue_text = f"{overdue_hours}h overdue"
                return f'{batch_name} | {batch_date} {batch_time} | {overdue_text}'
            else:
                # Calculate time until processing
                time_delta = obj.next_processing_time - now
                hours_until = int(time_delta.total_seconds() // 3600)
                if hours_until > 24:
                    days_until = hours_until // 24
                    time_text = f"in {days_until}d"
                elif hours_until > 0:
                    time_text = f"in {hours_until}h"
                else:
                    minutes_until = int(time_delta.total_seconds() // 60)
                    time_text = f"in {minutes_until}m" if minutes_until > 0 else "due now"
                return f'{batch_name} | {batch_date} {batch_time} | {time_text}'
        elif obj.batch_id:
            return f'Batch ID: {obj.batch_id}'
        else:
            return 'No batch assigned'
    batch_info_display.short_description = 'Batch Info'

    def total_gold_display(self, obj):
        total = obj.total_gold_with_bonus
        bonus_text = f" (includes bonus)" if obj.bonus else ""
        return f"{total:,} gold{bonus_text}"
    total_gold_display.short_description = 'Total Gold'

    def approval_type_display(self, obj):
        """Show payment verification status"""
        if obj.status == 'verified':
            if obj.verified_by:
                return 'Manual Verified'
            else:
                return 'System'
        elif obj.status == 'queued':
            return 'Queued for Batch'
        elif obj.status == 'processing':
            return 'In Review'
        elif obj.status == 'rejected':
            return 'Rejected'
        return obj.status.title()
    approval_type_display.short_description = 'Approval Type'

    def receipt_preview(self, obj):
        if obj.receipt_image:
            return format_html(
                '<img src="{}" style="width: 60px; height: 60px; object-fit: cover; border: 1px solid #ddd; border-radius: 4px;" title="Click to view full size" />',
                obj.receipt_image.url
            )
        return format_html('<span style="color: #999; font-style: italic;">No image</span>')
    receipt_preview.short_description = '📄 Receipt'

    def receipt_preview_large(self, obj):
        if obj.receipt_image:
            return format_html(
                '<img src="{}" style="max-width: 400px; max-height: 400px;" />',
                obj.receipt_image.url
            )
        return "No image uploaded"
    receipt_preview_large.short_description = 'Receipt Preview'

    def verify_payments(self, request, queryset):
        """Bulk verify payments and add gold to user accounts"""
        verified_count = 0
        
        for payment in queryset.filter(status__in=['queued', 'processing']):
            try:
                # Add gold to user account
                user = payment.user
                if hasattr(user, 'profile'):
                    # If using a profile model
                    profile = user.profile
                    profile.gold = (profile.gold or 0) + payment.total_gold_with_bonus
                    profile.save()
                else:
                    # If gold is stored directly on User model
                    user.gold = getattr(user, 'gold', 0) + payment.total_gold_with_bonus
                    user.save()
                
                # Update payment status
                payment.status = 'verified'
                payment.verified_by = request.user
                payment.verified_at = timezone.now()
                payment.save()
                
                # Create transaction record (if you have a transaction model)
                try:
                    from transactions.models import Transaction
                    Transaction.objects.create(
                        user=user,
                        transaction_type='PURCHASE',
                        amount=payment.total_gold_with_bonus,
                        description=f"Gold Package Purchase - {payment.package_amount} coins (₱{payment.package_price}){' + bonus' if payment.bonus else ''}",
                        reference=payment.payment_reference
                    )
                except ImportError:
                    # Transaction model doesn't exist, skip
                    pass
                
                verified_count += 1
                
            except Exception as e:
                messages.error(request, f"Error verifying payment {payment.payment_reference}: {str(e)}")
        
        if verified_count > 0:
            messages.success(request, f"Successfully verified {verified_count} payment(s) and added gold to user accounts.")
    
    verify_payments.short_description = "Verify selected payments and add gold"

    def reject_payments(self, request, queryset):
        """Bulk reject payments"""
        updated = queryset.filter(status='queued').update(
            status='rejected',
            verified_by=request.user,
            verified_at=timezone.now()
        )
        if updated:
            messages.success(request, f"Rejected {updated} payment(s).")
    
    reject_payments.short_description = "Reject selected payments"

    def save_model(self, request, obj, form, change):
        """Auto-set verified_by, verified_at when status changes, and sync package details"""
        
        # Auto-fill package details when gold_package is selected
        if obj.gold_package:
            obj.package_amount = obj.gold_package.gold_amount
            obj.package_price = obj.gold_package.price_php
            obj.bonus = obj.gold_package.bonus_gold
        
        if change and 'status' in form.changed_data:
            if obj.status in ['verified', 'rejected'] and not obj.verified_by:
                obj.verified_by = request.user
                obj.verified_at = timezone.now()
                
                # If verifying, add gold to user account
                if obj.status == 'verified':
                    try:
                        user = obj.user
                        if hasattr(user, 'profile') and hasattr(user.profile, 'gold'):
                            # If using a profile model with gold field
                            profile = user.profile
                            profile.gold = (profile.gold or 0) + obj.total_gold_with_bonus
                            profile.save()
                        elif hasattr(user, 'gold_balance'):
                            # If gold is stored as gold_balance on User model
                            user.gold_balance = (user.gold_balance or 0) + obj.total_gold_with_bonus
                            user.save()
                        elif hasattr(user, 'gold'):
                            # If gold is stored as gold on User model
                            user.gold = getattr(user, 'gold', 0) + obj.total_gold_with_bonus
                            user.save()
                        else:
                            raise Exception("No gold field found on user model")
                        
                        # Create transaction record
                        try:
                            from transactions.models import Transaction, TransactionType
                            Transaction.objects.create(
                                user=user,
                                type=TransactionType.PURCHASE,
                                amount=obj.total_gold_with_bonus,
                                description=f"Gold Package Purchase - {obj.package_amount} coins (₱{obj.package_price}){' + bonus' if obj.bonus else ''} - Ref: {obj.payment_reference}"
                            )
                        except ImportError:
                            pass
                            
                        messages.success(request, f"Payment verified and {obj.total_gold_with_bonus} gold added to {obj.user.username}'s account.")
                    except Exception as e:
                        messages.error(request, f"Error adding gold to user account: {str(e)}")
        
        super().save_model(request, obj, form, change)

    def start_batch_processing(self, request, queryset):
        """Start processing current batch of payments"""
        try:
            count, message = PaymentProof.start_batch_processing(admin_user=request.user)
            if count > 0:
                messages.success(request, message)
            else:
                messages.info(request, message)
        except Exception as e:
            messages.error(request, f"Error starting batch processing: {str(e)}")
    
    start_batch_processing.short_description = "Start batch processing for ready payments"

    def assign_to_next_batch(self, request, queryset):
        """Assign selected payments to next available batch"""
        assigned_count = 0
        
        for payment in queryset.filter(status='queued'):
            try:
                next_time = payment.assign_to_next_batch()
                assigned_count += 1
            except Exception as e:
                messages.error(request, f"Error assigning payment {payment.payment_reference}: {str(e)}")
        
        if assigned_count > 0:
            messages.success(request, f"Assigned {assigned_count} payment(s) to next batch.")
        else:
            messages.info(request, "No payments were assigned to batch.")
    
    assign_to_next_batch.short_description = "Assign to next batch"


@admin.register(GoldPackage)
class GoldPackageAdmin(admin.ModelAdmin):
    list_display = [
        'name',
        'gold_amount',
        'bonus_gold',
        'total_gold_display',
        'price_php',
        'price_per_gold_display',
        'is_active',
        'created_at'
    ]
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'gold_amount']
    readonly_fields = ['created_at', 'total_gold_display', 'price_per_gold_display']
    
    fieldsets = [
        ('Package Details', {
            'fields': [
                'name',
                'gold_amount',
                'bonus_gold',
                'bonus_description',
                'price_php',
                'is_active'
            ]
        }),
        ('Calculated Fields', {
            'fields': ['total_gold_display', 'price_per_gold_display', 'created_at'],
            'classes': ['collapse']
        })
    ]
    
    def total_gold_display(self, obj):
        """Display total gold including bonus"""
        return f"{obj.total_gold:,} gold"
    total_gold_display.short_description = "Total Gold (with bonus)"
    
    def price_per_gold_display(self, obj):
        """Display price per gold coin"""
        if obj.total_gold > 0:
            price_per_gold = float(obj.price_php) / obj.total_gold
            return f"₱{price_per_gold:.4f} per gold"
        return "N/A"
    price_per_gold_display.short_description = "Price per Gold"
    
    # Add some useful actions
    actions = ['activate_packages', 'deactivate_packages']
    
    def activate_packages(self, request, queryset):
        """Activate selected packages"""
        updated = queryset.update(is_active=True)
        messages.success(request, f"Activated {updated} package(s).")
    activate_packages.short_description = "Activate selected packages"
    
    def deactivate_packages(self, request, queryset):
        """Deactivate selected packages"""
        updated = queryset.update(is_active=False)
        messages.success(request, f"Deactivated {updated} package(s).")
    deactivate_packages.short_description = "Deactivate selected packages"
