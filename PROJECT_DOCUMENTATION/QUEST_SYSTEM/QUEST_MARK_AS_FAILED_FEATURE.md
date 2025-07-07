# Quest Mark as Failed Feature

## Overview

This feature allows quest creators to mark their in-progress quests as "failed" and reset all participant application attempt counters to 0. This provides a learning opportunity for participants to improve their work and reapply without penalty.

## Key Features

### 1. Mark as Failed Button
- Located in the Quest Submissions Modal alongside "Mark as Complete"
- Only visible to quest creators for in-progress quests
- Styled with a red color scheme to distinguish from completion

### 2. Attempt Counter Reset
- When a quest is marked as failed, all participant application attempt counters reset to 0
- This removes previous rejection penalties and allows unlimited re-application
- Participants can learn from feedback and start fresh

### 3. Quest Status Update
- Quest status changes from "in-progress" to "failed"
- Quest becomes available for participant re-engagement
- Gold reservations remain intact for potential quest restart

## Technical Implementation

### Frontend Changes

#### QuestSubmissionsModal Component
- Added `onMarkFailed` prop for failure handling
- Added `canMarkFailed` prop for permission control
- Updated UI to show both "Mark as Complete" and "Mark as Failed" buttons
- Enhanced submission guidelines to explain the reset behavior

#### QuestManagement Component
- Added `handleFailQuest` function to handle quest failure
- Updated modal props to include failure functionality
- Added proper error handling and success notifications

#### API Updates
- Updated `QuestAPI.markQuestAsFailed()` method
- Added "failed" status to quest status types
- Enhanced error handling for API calls

### Backend Changes

#### Quest Model
- Added "failed" status to `STATUS_CHOICES`
- Created migration for the new status option

#### Quest ViewSet
- Added `mark_failed` action endpoint
- Implements proper permission checking (quest creator only)
- Validates quest is in "in-progress" status
- Resets all participant attempt counters
- Updates quest status to "failed"

#### ApplicationAttempt Management
- Deletes all `ApplicationAttempt` records for the quest
- This effectively resets attempt counters to 0 for all participants
- Allows unlimited re-application after failure

## User Flow

1. **Quest Creator** views submissions in Quest Submissions Modal
2. **Creator** clicks "Mark as Failed" button next to "Mark as Complete"
3. **System** confirms the action and processes the failure:
   - Quest status → "failed"
   - All participant attempt counters → 0
   - Gold reservations remain intact
4. **Participants** can now re-apply unlimited times
5. **Success message** confirms the reset and participant count

## Benefits

### For Quest Creators
- Provides feedback mechanism without permanent penalties
- Allows quest restart with fresh participant engagement
- Maintains gold investment for potential quest continuation

### For Participants
- Learning opportunity without long-term consequences
- Fresh start after receiving feedback
- Unlimited re-application chances post-failure

### For Platform
- Encourages improvement and learning
- Reduces frustration from attempt limits
- Promotes collaborative quest completion

## API Endpoints

### Mark Quest as Failed
```
POST /api/quests/quests/{slug}/mark_failed/
```

**Requirements:**
- User must be authenticated
- User must be the quest creator
- Quest must be in "in-progress" status

**Response:**
```json
{
    "success": true,
    "message": "Quest marked as failed. All participant attempt counters have been reset to 0.",
    "failure_reason": "Marked as failed by creator",
    "participants_reset": 3
}
```

## Testing

The feature includes comprehensive testing:

### Core Functionality Test
- Creates test quest with participants
- Simulates application attempts
- Verifies attempt counter reset
- Confirms quest status update

### API Endpoint Test
- Tests authentication and authorization
- Verifies proper status transitions
- Confirms error handling

### Integration Test
- Frontend-backend communication
- UI state management
- Error message display

## Security Considerations

- Only quest creators can mark their own quests as failed
- Proper authentication and authorization checks
- Input validation for failure reasons
- Transaction safety for attempt counter resets

## Future Enhancements

1. **Failure Reasons**: Add structured failure reason categories
2. **Notification System**: Notify participants of quest failure
3. **Analytics**: Track failure rates and improvement patterns
4. **Feedback Integration**: Link failure to specific feedback comments
5. **Restart Mechanism**: One-click quest restart after failure

## Migration Notes

- Database migration required for new "failed" status
- Existing quests unaffected by the change
- Backward compatible with current application attempt system
