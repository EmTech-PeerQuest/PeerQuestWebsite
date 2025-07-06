from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.contrib import messages
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import PaymentProof

User = get_user_model()


@admin.register(PaymentProof)
class PaymentProofAdmin(admin.ModelAdmin):
    list_display = [
        'payment_reference', 
        'user', 
        'package_price', 
        'package_amount', 
        'total_gold_display',
        'status',
        'approval_type_display',
        'batch_info_display',
        'created_at',
        'receipt_preview'
    ]
    list_filter = ['status', 'scheduled_batch', 'created_at', 'package_price', 'batch_id']
    search_fields = ['payment_reference', 'user__username', 'user__email']
    readonly_fields = ['payment_reference', 'created_at', 'verified_at', 'processed_at', 'receipt_preview_large', 'batch_id', 'next_processing_time']
    
    fieldsets = [
        ('Payment Information', {
            'fields': [
                'user', 
                'payment_reference', 
                'package_amount', 
                'package_price', 
                'bonus',
                'created_at'
            ]
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
                '<img src="{}" style="width: 50px; height: 50px; object-fit: cover;" />',
                obj.receipt_image.url
            )
        return "No image"
    receipt_preview.short_description = 'Receipt'

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
        """Auto-set verified_by and verified_at when status changes"""
        if change and 'status' in form.changed_data:
            if obj.status in ['verified', 'rejected'] and not obj.verified_by:
                obj.verified_by = request.user
                obj.verified_at = timezone.now()
                
                # If verifying, add gold to user account
                if obj.status == 'verified':
                    try:
                        user = obj.user
                        if hasattr(user, 'profile'):
                            profile = user.profile
                            profile.gold = (profile.gold or 0) + obj.total_gold_with_bonus
                            profile.save()
                        else:
                            user.gold = getattr(user, 'gold', 0) + obj.total_gold_with_bonus
                            user.save()
                        
                        # Create transaction record
                        try:
                            from transactions.models import Transaction
                            Transaction.objects.create(
                                user=user,
                                transaction_type='PURCHASE',
                                amount=obj.total_gold_with_bonus,
                                description=f"Gold Package Purchase - {obj.package_amount} coins (₱{obj.package_price}){' + bonus' if obj.bonus else ''}",
                                reference=obj.payment_reference
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
