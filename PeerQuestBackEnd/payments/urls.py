from django.urls import path
from .views import SubmitPaymentProofView, UserPaymentProofsView, get_payment_status, BatchProcessingView, auto_process_batch

urlpatterns = [
    path('submit-proof/', SubmitPaymentProofView.as_view(), name='submit-payment-proof'),
    path('my-payments/', UserPaymentProofsView.as_view(), name='user-payment-proofs'),
    path('status/<str:payment_reference>/', get_payment_status, name='payment-status'),
    
    # Admin batch processing endpoints
    path('admin/batch/', BatchProcessingView.as_view(), name='batch-processing'),
    path('admin/auto-process/', auto_process_batch, name='auto-process-batch'),
]
