# Gold System Implementation

## Overview
This document describes the gold system implementation for PeerQuest. The gold system enables users to earn, spend, and track their gold balance within the platform.

## Features
- Transaction tracking with detailed history
- User gold balances
- Integration with quest completion for automatic rewards
- Admin tools for gold management

## Models

### Transaction
Stores all gold transactions with the following fields:
- `transaction_id`: Auto-incrementing primary key
- `user`: User who owns the transaction
- `type`: Type of transaction (QUEST_REWARD, QUEST_BONUS, PURCHASE, etc.)
- `amount`: The gold amount (positive for earnings, negative for expenses)
- `description`: Optional description of the transaction
- `quest`: Optional related quest
- `created_at`: Timestamp of the transaction

### UserBalance
Keeps track of a user's current gold balance:
- `user`: One-to-one relationship with a user
- `gold_balance`: Current gold balance for the user
- `last_updated`: Timestamp of the last balance update

## API Endpoints

### Transactions
- `GET /api/gold/transactions/` - List all transactions (admin only)
- `GET /api/gold/transactions/my_transactions/` - List current user's transactions
- `POST /api/gold/transactions/` - Create a new transaction (admin only)
- `GET /api/gold/transactions/{id}/` - View a specific transaction
- `PUT/PATCH /api/gold/transactions/{id}/` - Update a transaction (admin only)
- `DELETE /api/gold/transactions/{id}/` - Delete a transaction (admin only)

### Balances
- `GET /api/gold/balances/` - List all user balances (admin only)
- `GET /api/gold/balances/my_balance/` - Get current user's balance
- `GET /api/gold/balances/{id}/` - View a specific user's balance
- `PUT/PATCH /api/gold/balances/{id}/` - Update a user's balance (admin only)

## Integration with Quest System
- Quest model has a `gold_reward` field to specify gold awarded on completion
- When a quest is completed, gold is automatically awarded to the user
- Gold rewards are scaled based on quest difficulty

## Management Commands
- `update_quest_gold_rewards`: Add or update gold rewards for quests based on difficulty
- `recalculate_balances`: Recalculate all user balances from transaction history
- `reset_gold_system`: Reset all transaction and balance data (for testing only)

## Utility Functions
- `add_gold_to_user()`: Add gold to a user and create a transaction record
- `reward_quest_completion()`: Award gold for quest completion with optional bonus
- `get_user_balance()`: Get a user's current gold balance

## Admin Interface
The admin interface provides tools for:
- Viewing and managing all transactions
- Adjusting user balances
- Filtering transactions by user, type, and quest
- Adding manual adjustments when needed
