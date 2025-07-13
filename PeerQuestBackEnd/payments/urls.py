from django.urls import path
from .views import (
    GoldPackagesView,
    SubmitPaymentProofView, 
    UserPaymentProofsView, 
    get_payment_status, 
    BatchProcessingView, 
    auto_process_batch,
    AdminReceiptManagementView,
    AdminReceiptActionView,
    AdminBatchActionView
)

urlpatterns = [
    # Public endpoints
    path('packages/', GoldPackagesView.as_view(), name='gold-packages'),
    
    # User endpoints
    path('submit-proof/', SubmitPaymentProofView.as_view(), name='submit-payment-proof'),
    path('my-payments/', UserPaymentProofsView.as_view(), name='user-payment-proofs'),
    path('status/<str:payment_reference>/', get_payment_status, name='payment-status'),
    
    # Admin batch processing endpoints
    path('admin/batch/', BatchProcessingView.as_view(), name='batch-processing'),
    path('admin/auto-process/', auto_process_batch, name='auto-process-batch'),
    
    # New admin receipt management endpoints
    path('admin/receipts/', AdminReceiptManagementView.as_view(), name='admin-receipts'),
    path('admin/receipts/<int:payment_id>/action/', AdminReceiptActionView.as_view(), name='admin-receipt-action'),
    path('admin/receipts/batch-action/', AdminBatchActionView.as_view(), name='admin-batch-action'),
]
