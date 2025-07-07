from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import TransactionViewSet, UserBalanceViewSet, CashoutRequestViewSet

router = DefaultRouter()
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'balances', UserBalanceViewSet, basename='balance')
router.register(r'cashouts', CashoutRequestViewSet, basename='cashout')

urlpatterns = [
    path('', include(router.urls)),
]
