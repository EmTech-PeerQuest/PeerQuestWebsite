from django.shortcuts import render, get_object_or_404
from django.db import transaction as db_transaction
from django.db.models import Sum
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import Transaction, UserBalance, TransactionType
from .serializers import TransactionSerializer, UserBalanceSerializer, UserBalanceUpdateSerializer

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
