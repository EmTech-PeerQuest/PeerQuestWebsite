#!/usr/bin/env python
"""
Verify transaction logic understanding for the frontend fixes
"""
import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from transactions.models import Transaction, TransactionType

print("=== TRANSACTION LOGIC VERIFICATION ===")
print()

# Get all transactions grouped by type
all_transactions = Transaction.objects.all().order_by('-created_at')

print("Current transaction types and their meanings:")
print("- PURCHASE: Gold package purchases (user buys gold with money)")
print("- REWARD: Quest-related transactions (quest creation, quest completion)")  
print("- REFUND: Refunds (quest deletion refunds, purchase refunds)")
print("- TRANSFER: Gold transfers between users")
print()

print("Transaction breakdown by type:")
for trans_type in [TransactionType.PURCHASE, TransactionType.REWARD, TransactionType.REFUND, TransactionType.TRANSFER]:
    transactions = all_transactions.filter(type=trans_type)
    print(f"\n{trans_type.label} ({trans_type.value}) - {transactions.count()} transactions:")
    
    for t in transactions[:3]:  # Show first 3 of each type
        amount_str = f"+{t.amount}" if t.amount >= 0 else str(t.amount)
        direction = "INCOMING" if t.amount >= 0 else "OUTGOING"
        print(f"  {direction}: {amount_str} gold - {t.description}")
    
    if transactions.count() > 3:
        print(f"  ... and {transactions.count() - 3} more")

print("\n=== FRONTEND LOGIC VERIFICATION ===")
print()

# Verify our frontend understanding
purchase_transactions = all_transactions.filter(type=TransactionType.PURCHASE)
reward_transactions = all_transactions.filter(type=TransactionType.REWARD)

print("PURCHASE transactions should be:")
print("- Only actual gold package purchases (user spending money to buy gold)")
print("- All should be positive amounts (incoming gold)")
print("- Should NOT include quest creation")
print()

purchase_gold_packages = purchase_transactions.filter(
    description__icontains="Gold Package"
) | purchase_transactions.filter(
    description__icontains="Purchased"
) | purchase_transactions.filter(
    description__icontains="gold addition"
)

quest_creation_in_purchase = purchase_transactions.filter(
    description__icontains="Quest creation"
)

print(f"PURCHASE transactions that are gold packages: {purchase_gold_packages.count()}")
print(f"PURCHASE transactions that are quest creation: {quest_creation_in_purchase.count()}")

if quest_creation_in_purchase.count() > 0:
    print("⚠️  WARNING: Found quest creation transactions in PURCHASE type!")
    for t in quest_creation_in_purchase:
        print(f"   - {t.description} (Amount: {t.amount})")
else:
    print("✅ Good: No quest creation transactions found in PURCHASE type")

print()
print("REWARD transactions should be:")
print("- Quest creation (negative amounts - user spends gold)")
print("- Quest completion rewards (positive amounts - user gains gold)")
print()

quest_creation_in_reward = reward_transactions.filter(
    description__icontains="Quest creation"
)

quest_completion_in_reward = reward_transactions.filter(
    description__icontains="completing"
) | reward_transactions.filter(
    description__icontains="reward for"
)

print(f"REWARD transactions that are quest creation: {quest_creation_in_reward.count()}")
print(f"REWARD transactions that are quest completion: {quest_completion_in_reward.count()}")

if quest_creation_in_reward.count() > 0:
    print("✅ Good: Found quest creation transactions in REWARD type")
    for t in quest_creation_in_reward[:2]:
        direction = "outgoing" if t.amount < 0 else "incoming"
        print(f"   - {direction}: {t.description} (Amount: {t.amount})")
else:
    print("⚠️  No quest creation transactions found in REWARD type")

print("\n=== SUMMARY ===")
print("Frontend logic should be:")
print("1. PURCHASE type = only gold package purchases (always incoming)")
print("2. REWARD type = quest creation (outgoing) + quest completion (incoming)")  
print("3. Direction determined by amount sign: negative = outgoing, positive = incoming")
print("4. 'Gold Package Purchases Only' filter = PURCHASE type + description check")
print("5. 'Incoming Gold' = PURCHASE + REFUND + positive REWARD")
print("6. 'Outgoing Gold' = negative REWARD + TRANSFER")
