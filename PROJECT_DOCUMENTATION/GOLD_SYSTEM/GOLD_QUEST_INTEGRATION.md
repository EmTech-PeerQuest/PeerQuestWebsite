# Gold System Integration with Quests

This document describes how the gold system is integrated with the quest system in PeerQuest.

## Overview

The gold system allows users to earn and spend gold within the platform. When creating quests, users can offer gold rewards that will be given to participants upon quest completion.

## Gold Reward Limitations

- Quest creators can only offer gold rewards up to their available balance
- A 5% commission fee is applied to all gold rewards
- Gold (reward + commission) is reserved when a quest is created
- Reserved gold is not available for other quests until the quest is completed or deleted

## Gold Flows

1. **Quest Creation**: 
   - User creates a quest with a gold reward
   - System adds a 5% commission fee to the reward amount
   - System verifies user has enough available gold (reward + commission)
   - Total gold (reward + commission) is reserved but not yet deducted from the user's balance

2. **Quest Updates**:
   - If gold reward is increased, system verifies sufficient available balance
   - Gold reservation is updated to reflect the new reward amount

3. **Quest Deletion**:
   - Reserved gold is released back to the creator's available balance

4. **Quest Completion**:
   - Total gold (reward + commission) is deducted from the creator's balance
   - Reward gold is awarded to all participants who completed the quest
   - Commission gold is kept by the system (not awarded to any user)
   - Gold reservation is released

## API Endpoints

- `GET /api/quests/stats/`: Includes gold statistics in the dashboard
- `GET /api/transactions/quest-rewards/`: Lists all quest reward transactions

## Technical Implementation

- `QuestGoldReservation` model tracks gold reserved for quests
- `get_available_balance()` calculates user's balance minus reserved gold
- Gold award is handled in the `award_xp_and_gold_on_quest_completion` signal handler
