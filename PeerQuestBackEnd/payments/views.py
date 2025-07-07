from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.views import APIView
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from .models import PaymentProof
from .serializers import PaymentProofSubmissionSerializer, PaymentProofSerializer
import logging

logger = logging.getLogger(__name__)


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
