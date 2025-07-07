# Gold System Security Implementation

## Overview
The gold system has been implemented with robust security measures to ensure that **ALL users**, regardless of their role or privileges, can only access their own transaction data and gold balance information when using the gold system modal.

## User Types Covered
The security implementation protects data access for all user types in the system:

- **Regular Users** - Standard users who participate in quests
- **Quest Creators** - Users who create quests for others to complete
- **Staff Users** - Users with `is_staff=True` privilege
- **Admin Users** - Users with elevated administrative privileges
- **Superusers** - Users with `is_superuser=True` privilege

## Security Implementation Details

### Backend Security (Django)

#### Transaction Access Control
```python
# File: PeerQuestBackEnd/transactions/views.py

class TransactionViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        user = self.request.user
        # SECURITY: All users (adventurers, quest makers, moderators, and admins) 
        # can only see their own transactions when using the gold system modal.
        # This prevents any user type from viewing other users' transaction history.
        # Admin panel access for viewing all transactions is handled through 
        # separate admin-only endpoints (all_transactions, all_quest_rewards).
        return Transaction.objects.filter(user=user)
```

#### Balance Access Control
```python
class UserBalanceViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        user = self.request.user
        # SECURITY: All users (adventurers, quest makers, moderators, and admins) 
        # can only see their own balance when using the gold system modal.
        # This prevents any user type from viewing other users' gold balances.
        # Admin balance management is handled through separate admin-only endpoints.
        return UserBalance.objects.filter(user=user)
```

### Endpoint Separation

#### Personal Endpoints (User-Specific)
- `GET /api/transactions/transactions/` - Returns only the authenticated user's transactions
- `GET /api/transactions/my_transactions/` - Explicit user-specific transaction endpoint
- `GET /api/transactions/quest_rewards/` - Returns only the authenticated user's quest rewards
- `GET /api/user-balances/my_balance/` - Returns only the authenticated user's balance

#### Admin-Only Endpoints
- `GET /api/transactions/all_transactions/` - Returns all transactions (admin only)
- `GET /api/transactions/all_quest_rewards/` - Returns all quest rewards (admin only)
- `GET /api/user-balances/all_balances/` - Returns all user balances (admin only)

### Frontend Security

#### API Call Protection
```typescript
// File: PeerQuestFrontEnd/components/gold/gold-system-modal.tsx

// SECURITY: This endpoint ensures all users (adventurers, quest makers, moderators, admins)
// can only see their own transactions, preventing unauthorized access to other users' data
const fetchTransactions = async () => {
    if (!currentUser?.id) return

    const response = await fetch(`${apiUrl}/api/transactions/transactions/`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    })
    // ... rest of implementation
}
```

## Key Security Features

### 1. Query-Level Filtering
- All personal endpoints filter by `request.user` at the database query level
- No possibility of privilege escalation or data leakage
- Consistent across all user types regardless of admin status

### 2. Endpoint Separation
- Clear separation between personal and administrative endpoints
- Admin functions require explicit `IsAdminUser` permission
- Personal functions never expose other users' data

### 3. Frontend Data Isolation
- Gold system modal only calls personal endpoints
- No mixing of personal and administrative data in the UI
- Proper error handling for unauthorized access

### 4. Permission Classes
```python
class IsAdminUser(permissions.BasePermission):
    """
    Permission to only allow admin users to access the view
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_staff
```

## Transaction Categories and Filtering

The system properly categorizes transactions to ensure accurate reporting:

### Transaction Types
- **PURCHASE** - Gold package purchases (positive amounts, displayed as incoming)
- **REWARD** - Quest completion rewards (positive amounts, displayed as outgoing)
- **TRANSFER** - Gold transfers between users (handled as outgoing)
- **REFUND** - Refunds for quest deletion (positive amounts, displayed as incoming)

### Filtering Logic
```typescript
// Only count actual gold package purchases, not quest creation costs
const totalPurchased = filteredTransactions
    .filter((t) => t.type === "PURCHASE" && 
            (t.description?.includes("Gold Package") || t.description?.includes("Purchased")))
    .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0) || 0

// Only count quest completion rewards as gold spent
const totalSpent = filteredTransactions
    .filter((t) => t.type === "REWARD")
    .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0) || 0
```

## Testing Verification

### Security Tests Completed
1. ✅ Verified admin users cannot see other users' transactions in gold modal
2. ✅ Verified staff users cannot see other users' transactions in gold modal  
3. ✅ Verified regular users cannot see other users' transactions in gold modal
4. ✅ Verified separate admin endpoints work correctly for administrative functions
5. ✅ Verified frontend only calls appropriate personal endpoints
6. ✅ Verified transaction categorization works correctly
7. ✅ Verified filtering and summary calculations are accurate

### Database-Level Security
- All queries use `filter(user=request.user)` 
- No raw SQL or potential injection points
- Django ORM provides automatic query protection

## Administrative Access

For administrative functions, separate endpoints are provided:
- Admin panel in Django admin interface
- Dedicated admin-only API endpoints with proper permission checks
- Clear separation between personal user functions and administrative oversight

## Conclusion

The gold system implementation ensures that:
1. **No user can view another user's transaction history** regardless of their role
2. **No user can view another user's gold balance** regardless of their role  
3. **Administrative functions are properly separated** and require explicit permissions
4. **Frontend UI only displays user-specific data** with no data leakage
5. **Transaction categorization is accurate** and prevents confusion between different types of transactions

This implementation provides robust security while maintaining a clear user experience and proper administrative capabilities.
