# Quest Application Restrictions - Implementation Summary

## Overview
This implementation ensures that once a quest is in progress, other users cannot attempt to apply or join the quest. The restriction is enforced at both the backend (validation) and frontend (UI) levels.

## Backend Implementation

### 1. Quest Model (`quests/models.py`)
- The `can_accept_participants` property returns `True` only when quest status is 'open'
- Quest status automatically changes to 'in-progress' when the first participant is assigned

### 2. Quest Join Validation (`quests/serializers.py`)
- `QuestParticipantCreateSerializer.validate()` enhanced with specific error messages:
  - "This quest is already in progress and cannot accept new participants."
  - "This quest has been completed and cannot accept new participants."

### 3. Application System (`applications/serializers.py`)
- `ApplicationCreateSerializer.validate()` already validates:
  - Quest status must be 'open'
  - Quest must be able to accept participants

## Frontend Implementation

### 1. Quest Details Modal (`components/quests/quest-details-modal.tsx`)
- Added `questNotAvailable` check for quest status
- Apply button is disabled when quest is 'in-progress' or 'completed'
- Button text changes to:
  - "Quest In Progress" for in-progress quests
  - "Quest Completed" for completed quests

### 2. Quest Management Components
- Existing components already properly handle in-progress quest restrictions
- Delete functionality is disabled for in-progress and completed quests

## Validation Flow

### When a Quest is Open:
1. ✅ Users can apply via Application system
2. ✅ Users can join directly via Quest join system
3. ✅ Frontend shows "Apply for Quest" button

### When a Quest is In-Progress:
1. ❌ Application attempts are blocked with error: "This quest is no longer accepting applications"
2. ❌ Direct join attempts are blocked with error: "This quest is already in progress and cannot accept new participants"
3. ❌ Frontend shows "Quest In Progress" disabled button

### When a Quest is Completed:
1. ❌ Application attempts are blocked with error: "This quest is no longer accepting applications"
2. ❌ Direct join attempts are blocked with error: "This quest has been completed and cannot accept new participants"
3. ❌ Frontend shows "Quest Completed" disabled button

## Error Handling
- Backend validation errors are properly caught and displayed as toast notifications
- Clear, user-friendly error messages explain why applications/joins are not allowed
- UI elements are visually disabled to prevent confusion

## Test Coverage
- ✅ Backend validation tested with multiple scenarios
- ✅ Workflow tested end-to-end from open → in-progress → restriction enforcement
- ✅ Both Application and Direct Join systems validated

## Key Files Modified
1. `PeerQuestBackEnd/quests/serializers.py` - Enhanced validation messages
2. `PeerQuestFrontEnd/components/quests/quest-details-modal.tsx` - UI restrictions and status handling

## Edge Cases Handled
- Quest status transitions properly update restrictions
- Multiple application paths (direct join vs application system) both enforced
- Clear distinction between in-progress and completed quest restrictions
- Proper null checking for TypeScript safety
