from django.shortcuts import render, get_object_or_404
from django.db import transaction as db_transaction
from django.db.models import Sum
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import Transaction, UserBalance, TransactionType, CashoutRequest, CashoutStatus, CashoutMethod
from .serializers import TransactionSerializer, UserBalanceSerializer, UserBalanceUpdateSerializer, CashoutRequestSerializer

# Define permission classes to replace common.permissions
class IsAdminUser(permissions.BasePermission):
    """
    Permission to only allow admin users to access the view
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_staff

class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['user', 'type', 'quest']
    search_fields = ['description', 'type']
    ordering_fields = ['created_at', 'amount']
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [permissions.IsAuthenticated()]
        
    def get_queryset(self):
        user = self.request.user
        # SECURITY: All users (adventurers, quest makers, moderators, and admins) 
        # can only see their own transactions when using the gold system modal.
        # This prevents any user type from viewing other users' transaction history.
        # Admin panel access for viewing all transactions is handled through 
        # separate admin-only endpoints (all_transactions, all_quest_rewards).
        return Transaction.objects.filter(user=user)

    @action(detail=False, methods=['get'])
    def my_transactions(self, request):
        """Get transactions for the current user"""
        transactions = Transaction.objects.filter(user=request.user)
        page = self.paginate_queryset(transactions)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(transactions, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAdminUser])
    def all_transactions(self, request):
        """Get all transactions - Admin only"""
        transactions = Transaction.objects.all()
        page = self.paginate_queryset(transactions)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(transactions, many=True)
        return Response(serializer.data)
        
    @action(detail=False, methods=['get'])
    def quest_rewards(self, request):
        """Get quest reward transactions for the current user only
        
        SECURITY: This endpoint ensures ALL users (staff/admin, regular users, etc.)
        can only see their own quest reward transactions. No privilege escalation allowed.
        """
        transactions = Transaction.objects.filter(
            user=request.user, 
            type=TransactionType.REWARD
        )
        page = self.paginate_queryset(transactions)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(transactions, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAdminUser])
    def all_quest_rewards(self, request):
        """Get all quest reward transactions - Admin only"""
        transactions = Transaction.objects.filter(type=TransactionType.REWARD)
        page = self.paginate_queryset(transactions)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(transactions, many=True)
        return Response(serializer.data)
    
    @db_transaction.atomic
    def perform_create(self, serializer):
        """Create a transaction and update the user's gold balance"""
        transaction = serializer.save()
        user = transaction.user
        
        # Create or get user balance
        balance, created = UserBalance.objects.get_or_create(user=user)
        
        # Update balance based on transaction amount
        balance.gold_balance += transaction.amount
        balance.save()

class UserBalanceViewSet(viewsets.ModelViewSet):
    queryset = UserBalance.objects.all()
    serializer_class = UserBalanceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return UserBalanceUpdateSerializer
        return UserBalanceSerializer
    
    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [permissions.IsAuthenticated()]
    
    def get_queryset(self):
        user = self.request.user
        # SECURITY: All users (adventurers, quest makers, moderators, and admins) 
        # can only see their own balance when using the gold system modal.
        # This prevents any user type from viewing other users' gold balances.
        # Admin balance management is handled through separate admin-only endpoints.
        return UserBalance.objects.filter(user=user)
    
    @action(detail=False, methods=['get'])
    def my_balance(self, request):
        """Get balance for the current user
        
        SECURITY: This endpoint ensures ALL users (staff/admin, regular users, etc.)
        can only see their own balance. No privilege escalation allowed.
        """
        balance, created = UserBalance.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(balance)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAdminUser])
    def all_balances(self, request):
        """Get all user balances - Admin only"""
        balances = UserBalance.objects.all()
        page = self.paginate_queryset(balances)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(balances, many=True)
        return Response(serializer.data)

class CashoutRequestViewSet(viewsets.ModelViewSet):
    queryset = CashoutRequest.objects.all()
    serializer_class = CashoutRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'method']
    ordering_fields = ['created_at', 'amount_gold', 'amount_php']
    
    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy', 'process_cashout']:
            return [IsAdminUser()]
        return [permissions.IsAuthenticated()]
        
    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            # Admins can see all cashout requests
            return CashoutRequest.objects.all()
        # Regular users can only see their own cashout requests
        return CashoutRequest.objects.filter(user=user)

    @action(detail=False, methods=['get'])
    def my_cashouts(self, request):
        """Get cashout requests for the current user"""
        cashouts = CashoutRequest.objects.filter(user=request.user)
        page = self.paginate_queryset(cashouts)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(cashouts, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def request_cashout(self, request):
        """Request a cashout"""
        from decimal import Decimal
        
        amount_gold = request.data.get('amount_gold')
        method = request.data.get('method')
        payment_details = request.data.get('payment_details', '')
        
        if not amount_gold or not method:
            return Response(
                {'error': 'Amount and method are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            amount_gold = Decimal(str(amount_gold))
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid amount format'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if amount_gold < 5000:
            return Response(
                {'error': 'Minimum cashout amount is 5,000 gold'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if method not in dict(CashoutMethod.choices):
            return Response(
                {'error': 'Invalid cashout method'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check user balance
        try:
            user_balance = UserBalance.objects.get(user=request.user)
            if user_balance.gold_balance < amount_gold:
                return Response(
                    {'error': 'Insufficient gold balance'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        except UserBalance.DoesNotExist:
            return Response(
                {'error': 'User balance not found'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Calculate PHP amount
        exchange_rate = Decimal('0.0700')  # 1 gold = 0.07 PHP
        amount_php = amount_gold * exchange_rate
        
        # Create cashout request and transaction atomically
        with db_transaction.atomic():
            # Create the transaction record first
            transaction_record = Transaction.objects.create(
                user=request.user,
                type=TransactionType.CASHOUT,
                amount=-amount_gold,  # Negative because gold is leaving the account
                description=f"Cashout request: {amount_gold} gold to {method.upper()}"
            )
            
            # Create cashout request
            cashout_request = CashoutRequest.objects.create(
                user=request.user,
                amount_gold=amount_gold,
                amount_php=amount_php,
                exchange_rate=exchange_rate,
                method=method,
                payment_details=payment_details,
                transaction=transaction_record
            )
            
            # Update user balance
            user_balance.gold_balance -= amount_gold
            user_balance.save()
        
        serializer = self.get_serializer(cashout_request)
        return Response(
            {
                'message': f'Cashout request submitted successfully. You will receive ₱{amount_php:.2f} via {method.upper()}. Processing time: 24-72 hours.',
                'cashout_request': serializer.data
            }, 
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def process_cashout(self, request, pk=None):
        """Process a cashout request (admin only)"""
        from django.utils import timezone
        
        cashout_request = self.get_object()
        action = request.data.get('action')  # 'approve' or 'reject'
        notes = request.data.get('notes', '')
        
        if action not in ['approve', 'reject']:
            return Response(
                {'error': 'Action must be "approve" or "reject"'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not cashout_request.is_pending:
            return Response(
                {'error': 'Can only process pending cashout requests'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        with db_transaction.atomic():
            if action == 'approve':
                cashout_request.status = CashoutStatus.COMPLETED
                cashout_request.notes = notes or 'Cashout approved and processed'
            else:  # reject
                cashout_request.status = CashoutStatus.REJECTED
                cashout_request.notes = notes or 'Cashout rejected'
                
                # Refund the gold if rejected
                user_balance, created = UserBalance.objects.get_or_create(user=cashout_request.user)
                user_balance.gold_balance += cashout_request.amount_gold
                user_balance.save()
                
                # Create a refund transaction
                Transaction.objects.create(
                    user=cashout_request.user,
                    type=TransactionType.REFUND,
                    amount=cashout_request.amount_gold,
                    description=f"Refund for rejected cashout request #{cashout_request.id}"
                )
            
            cashout_request.processed_at = timezone.now()
            cashout_request.save()
        
        serializer = self.get_serializer(cashout_request)
        return Response(
            {
                'message': f'Cashout request {action}ed successfully',
                'cashout_request': serializer.data
            }
        )

    @action(detail=True, methods=['post'])
    def cancel_cashout(self, request, pk=None):
        """Cancel a cashout request (user can cancel their own pending requests)"""
        from django.utils import timezone
        
        cashout_request = self.get_object()
        
        # Users can only cancel their own requests
        if cashout_request.user != request.user:
            return Response(
                {'error': 'You can only cancel your own cashout requests'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        if not cashout_request.can_be_cancelled:
            return Response(
                {'error': 'Can only cancel pending cashout requests'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        with db_transaction.atomic():
            cashout_request.status = CashoutStatus.REJECTED
            cashout_request.notes = 'Cancelled by user'
            cashout_request.processed_at = timezone.now()
            cashout_request.save()
            
            # Refund the gold
            user_balance, created = UserBalance.objects.get_or_create(user=cashout_request.user)
            user_balance.gold_balance += cashout_request.amount_gold
            user_balance.save()
            
            # Create a refund transaction
            Transaction.objects.create(
                user=cashout_request.user,
                type=TransactionType.REFUND,
                amount=cashout_request.amount_gold,
                description=f"Refund for cancelled cashout request #{cashout_request.id}"
            )
        
        serializer = self.get_serializer(cashout_request)
        return Response(
            {
                'message': 'Cashout request cancelled successfully',
                'cashout_request': serializer.data
            }
        )
