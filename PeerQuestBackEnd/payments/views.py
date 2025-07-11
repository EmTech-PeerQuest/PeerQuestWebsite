from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.views import APIView
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from django.db.models import Q
from .models import PaymentProof, GoldPackage
from .serializers import PaymentProofSubmissionSerializer, PaymentProofSerializer, GoldPackageSerializer
import logging

logger = logging.getLogger(__name__)


class GoldPackagesView(APIView):
    """API endpoint to get available gold packages"""
    permission_classes = [permissions.AllowAny]  # Public endpoint
    
    def get(self, request):
        """Get all active gold packages"""
        try:
            packages = GoldPackage.objects.filter(is_active=True).order_by('price_php')
            serializer = GoldPackageSerializer(packages, many=True)
            
            return Response({
                'success': True,
                'packages': serializer.data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error fetching gold packages: {str(e)}")
            return Response({
                'success': False,
                'message': 'Error fetching gold packages.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SubmitPaymentProofView(APIView):
    """API endpoint for users to submit payment proof"""
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        try:
            # Log the incoming request data (excluding sensitive info)
            logger.info(f"Payment proof submission from user {request.user.username}")
            
            # Create serializer with request data
            serializer = PaymentProofSubmissionSerializer(data=request.data)
            
            if serializer.is_valid():
                # Save the payment proof with the current user
                payment_proof = serializer.save(user=request.user)
                
                logger.info(f"Payment proof created: {payment_proof.payment_reference}")
                
                # Assign to next batch and get processing time
                next_processing_time = payment_proof.assign_to_next_batch()
                
                # Use simple formatting for database storage and API responses
                processing_time_str = next_processing_time.isoformat()
                
                # Return success response with batch info
                response_serializer = PaymentProofSerializer(payment_proof)
                return Response({
                    'success': True,
                    'message': 'Payment proof submitted successfully.',
                    'batch_info': {
                        'batch_name': payment_proof.batch_id,
                        'processing_time': processing_time_str,
                        'batch_id': payment_proof.batch_id
                    },
                    'payment': response_serializer.data
                }, status=status.HTTP_201_CREATED)
            
            else:
                logger.warning(f"Payment proof submission validation failed: {serializer.errors}")
                return Response({
                    'success': False,
                    'message': 'Invalid data provided.',
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"Error submitting payment proof: {str(e)}")
            return Response({
                'success': False,
                'message': 'An error occurred while submitting your payment proof. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserPaymentProofsView(APIView):
    """API endpoint for users to view their payment proof history"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        try:
            # Get all payment proofs for the current user
            payment_proofs = PaymentProof.objects.filter(user=request.user).order_by('-created_at')
            serializer = PaymentProofSerializer(payment_proofs, many=True)
            
            return Response({
                'success': True,
                'payments': serializer.data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error fetching user payment proofs: {str(e)}")
            return Response({
                'success': False,
                'message': 'An error occurred while fetching your payment history.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_payment_status(request, payment_reference):
    """Get the status of a specific payment by reference"""
    try:
        payment_proof = PaymentProof.objects.get(
            payment_reference=payment_reference,
            user=request.user
        )
        
        serializer = PaymentProofSerializer(payment_proof)
        return Response({
            'success': True,
            'payment': serializer.data
        }, status=status.HTTP_200_OK)
        
    except PaymentProof.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Payment not found.'
        }, status=status.HTTP_404_NOT_FOUND)
        
    except Exception as e:
        logger.error(f"Error fetching payment status: {str(e)}")
        return Response({
            'success': False,
            'message': 'An error occurred while fetching payment status.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BatchProcessingView(APIView):
    """Admin endpoint for batch processing payments"""
    permission_classes = [permissions.IsAdminUser]
    
    def get(self, request):
        """Get current batch status and ready payments"""
        try:
            ready_payments = PaymentProof.objects.get_current_batch_payments()
            next_time, batch_name = PaymentProof.get_next_batch_time()
            
            return Response({
                'success': True,
                'ready_for_processing': ready_payments.count(),
                'next_batch_time': next_time.isoformat(),
                'next_batch_name': batch_name,
                'payments': PaymentProofSerializer(ready_payments, many=True).data
            })
            
        except Exception as e:
            logger.error(f"Error getting batch status: {str(e)}")
            return Response({
                'success': False,
                'message': 'Error getting batch status.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def post(self, request):
        """Start batch processing"""
        try:
            count, message = PaymentProof.start_batch_processing(request.user)
            
            if count > 0:
                return Response({
                    'success': True,
                    'message': message,
                    'processed_count': count
                })
            else:
                return Response({
                    'success': False,
                    'message': message
                })
                
        except Exception as e:
            logger.error(f"Error starting batch processing: {str(e)}")
            return Response({
                'success': False,
                'message': 'Error starting batch processing.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def auto_process_batch(request):
    """Manual batch processing - all payments require manual verification"""
    try:
        ready_payments = PaymentProof.get_current_batch_payments()
        total_count = ready_payments.count()
        
        if total_count == 0:
            return Response({
                'success': False,
                'message': 'No payments ready for processing.'
            })
        
        # Start batch processing (moves to 'processing' status for manual review)
        count, message = PaymentProof.start_batch_processing(request.user)
        
        return Response({
            'success': True,
            'total_payments': total_count,
            'message': f'Started batch processing for {total_count} payments. All require manual verification.'
        })
        
    except Exception as e:
        logger.error(f"Error in batch processing: {str(e)}")
        return Response({
            'success': False,
            'message': 'Error in batch processing.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminReceiptManagementView(APIView):
    """Admin endpoint for comprehensive receipt management"""
    permission_classes = [permissions.IsAdminUser]
    
    def get(self, request):
        """Get all receipt submissions with filtering"""
        try:
            # Get query parameters
            status_filter = request.query_params.get('status', 'all')
            batch_filter = request.query_params.get('batch', 'all')
            search_query = request.query_params.get('search', '')
            
            # Start with only receipts that are ready for review (from past batches)
            from django.utils import timezone
            now = timezone.now()
            
            # Only show receipts whose batch time has arrived (ready for admin review)
            queryset = PaymentProof.objects.filter(
                next_processing_time__lte=now  # Only past batch times
            ).order_by('-created_at')
            
            # Apply status filter
            if status_filter != 'all':
                queryset = queryset.filter(status=status_filter)
            
            # Apply batch filter
            if batch_filter != 'all':
                queryset = queryset.filter(scheduled_batch=batch_filter)
            
            # Apply search filter
            if search_query:
                queryset = queryset.filter(
                    Q(user__username__icontains=search_query) |
                    Q(payment_reference__icontains=search_query) |
                    Q(batch_id__icontains=search_query)
                )
            
            # Serialize data
            serializer = PaymentProofSerializer(queryset, many=True, context={'request': request})
            
            # Get statistics with time-aware counts
            from django.utils import timezone
            now = timezone.now()
            
            stats = {
                'total': PaymentProof.objects.count(),
                'queued_future': PaymentProof.objects.filter(
                    status='queued', 
                    next_processing_time__gt=now
                ).count(),  # Receipts waiting for their batch time
                'queued_ready': PaymentProof.objects.filter(
                    status='queued', 
                    next_processing_time__lte=now
                ).count(),  # Receipts ready for admin review
                'processing': PaymentProof.objects.filter(status='processing').count(),
                'verified': PaymentProof.objects.filter(status='verified').count(),
                'rejected': PaymentProof.objects.filter(status='rejected').count(),
            }
            
            # Get next batch info
            next_time, batch_name = PaymentProof.get_next_batch_time()
            ready_for_processing = PaymentProof.get_current_batch_payments().count()
            
            return Response({
                'success': True,
                'receipts': serializer.data,
                'statistics': stats,
                'batch_info': {
                    'next_batch_time': next_time.isoformat(),
                    'next_batch_name': batch_name,
                    'ready_for_processing': ready_for_processing
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error fetching receipts for admin: {str(e)}")
            return Response({
                'success': False,
                'message': 'Error fetching receipt data.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminReceiptActionView(APIView):
    """Admin endpoint for individual receipt actions"""
    permission_classes = [permissions.IsAdminUser]
    
    def post(self, request, payment_id):
        """Perform action on individual receipt"""
        try:
            action = request.data.get('action')
            notes = request.data.get('notes', '')
            
            payment_proof = PaymentProof.objects.get(id=payment_id)
            
            if action == 'approve':
                payment_proof.status = 'verified'
                payment_proof.verified_by = request.user
                payment_proof.verified_at = timezone.now()
                payment_proof.verification_notes = notes
                
                # Add gold to user and create transaction
                if payment_proof.add_gold_to_user():
                    payment_proof.create_transaction_record()
                    message = f"Receipt approved and {payment_proof.total_gold_with_bonus} gold added to {payment_proof.user.username}"
                else:
                    message = "Receipt approved but error adding gold to user"
                
            elif action == 'reject':
                payment_proof.status = 'rejected'
                payment_proof.verified_by = request.user
                payment_proof.verified_at = timezone.now()
                payment_proof.verification_notes = notes
                message = f"Receipt rejected for {payment_proof.user.username}"
                
            elif action == 'requeue':
                # Assign to next batch
                next_time = payment_proof.assign_to_next_batch()
                message = f"Receipt requeued for next batch at {next_time.strftime('%m/%d %I:%M %p')}"
                
            else:
                return Response({
                    'success': False,
                    'message': 'Invalid action specified.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            payment_proof.save()
            
            return Response({
                'success': True,
                'message': message,
                'receipt': PaymentProofSerializer(payment_proof).data
            }, status=status.HTTP_200_OK)
            
        except PaymentProof.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Receipt not found.'
            }, status=status.HTTP_404_NOT_FOUND)
            
        except Exception as e:
            logger.error(f"Error performing receipt action: {str(e)}")
            return Response({
                'success': False,
                'message': 'Error performing action on receipt.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminBatchActionView(APIView):
    """Admin endpoint for batch processing actions"""
    permission_classes = [permissions.IsAdminUser]
    
    def post(self, request):
        """Perform batch actions on multiple receipts"""
        try:
            action = request.data.get('action')
            receipt_ids = request.data.get('receipt_ids', [])
            notes = request.data.get('notes', '')
            
            if not receipt_ids:
                return Response({
                    'success': False,
                    'message': 'No receipts selected.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            receipts = PaymentProof.objects.filter(id__in=receipt_ids)
            
            if not receipts.exists():
                return Response({
                    'success': False,
                    'message': 'No valid receipts found.'
                }, status=status.HTTP_404_NOT_FOUND)
            
            processed_count = 0
            
            if action == 'approve_batch':
                for receipt in receipts:
                    if receipt.status in ['queued', 'processing']:
                        receipt.status = 'verified'
                        receipt.verified_by = request.user
                        receipt.verified_at = timezone.now()
                        receipt.verification_notes = notes
                        receipt.save()
                        
                        # Add gold and create transaction
                        if receipt.add_gold_to_user():
                            receipt.create_transaction_record()
                        
                        processed_count += 1
                
                message = f"Approved {processed_count} receipts in batch"
                
            elif action == 'reject_batch':
                for receipt in receipts:
                    if receipt.status in ['queued', 'processing']:
                        receipt.status = 'rejected'
                        receipt.verified_by = request.user
                        receipt.verified_at = timezone.now()
                        receipt.verification_notes = notes
                        receipt.save()
                        processed_count += 1
                
                message = f"Rejected {processed_count} receipts in batch"
                
            elif action == 'start_processing':
                count, batch_message = PaymentProof.start_batch_processing(request.user)
                message = batch_message
                processed_count = count
                
            else:
                return Response({
                    'success': False,
                    'message': 'Invalid batch action specified.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            return Response({
                'success': True,
                'message': message,
                'processed_count': processed_count
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error performing batch action: {str(e)}")
            return Response({
                'success': False,
                'message': 'Error performing batch action.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
