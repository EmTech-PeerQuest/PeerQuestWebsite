# Backend API Requirements for "Kicked" Status Implementation

## Overview
This document outlines the backend API changes needed to support the new "kicked" status for quest participants, which differentiates between rejecting an application and kicking an existing participant.

## API Endpoint Requirements

### 1. New Endpoint: Kick Participant
**Endpoint:** `POST /api/applications/{applicationId}/kick/`

**Purpose:** Update an application status to "kicked" instead of removing it entirely.

**Request Body:**
```json
{
  "reason": "Optional reason for kicking the participant"
}
```

**Response:**
```json
{
  "id": 123,
  "status": "kicked",
  "quest": {
    "id": 456,
    "title": "Quest Title",
    // ... other quest fields
  },
  "applicant": {
    "id": 789,
    "username": "participant_username",
    // ... other user fields
  },
  "applied_at": "2025-01-01T12:00:00Z",
  "reviewed_at": "2025-01-01T15:00:00Z",
  "reviewed_by": {
    "id": 101,
    "username": "quest_giver_username",
    "email": "questgiver@example.com"
  },
  "kick_reason": "Optional reason for kicking"
}
```

**Error Responses:**
- `404` - Application not found
- `403` - User not authorized to kick this participant
- `400` - Invalid request (e.g., cannot kick from a completed quest)

### 2. Updated Application Model
The Application model should support the following statuses:
- `pending` - Application submitted, awaiting review
- `approved` - Application accepted, user is participating
- `rejected` - Application rejected during review process
- `kicked` - Participant was removed from quest after being approved

### 3. Database Schema Updates
```sql
-- Update the status field to include 'kicked'
ALTER TABLE applications 
MODIFY COLUMN status ENUM('pending', 'approved', 'rejected', 'kicked') NOT NULL;

-- Add optional kick reason field
ALTER TABLE applications 
ADD COLUMN kick_reason TEXT NULL;
```

### 4. Business Logic Requirements

#### Kick Participant Logic:
1. **Validation:**
   - Only quest creators can kick participants
   - Can only kick participants with 'approved' status
   - Cannot kick from completed quests

2. **Status Update:**
   - Change application status from 'approved' to 'kicked'
   - Set `reviewed_at` to current timestamp
   - Set `reviewed_by` to the quest creator
   - Store optional kick reason

3. **Quest Status Management:**
   - If no approved participants remain after kicking, revert quest status to 'open'
   - Remove participant from quest's active participants list
   - Preserve application record for history/audit purposes

#### Participant Access Control:
1. **Quest Access:**
   - Kicked participants should not appear in quest participant lists
   - Kicked participants cannot submit work for the quest
   - Kicked participants cannot re-apply to the same quest

2. **Data Filtering:**
   - When loading "my participating quests", exclude quests where user status is 'kicked'
   - Kicked applications should still appear in quest management for audit purposes

### 5. Existing Endpoint Updates

#### `GET /api/applications/my_applications/`
Should continue to return all user applications including kicked ones, but frontend will filter appropriately.

#### `GET /api/applications/to_my_quests/`
Should return all applications including kicked ones for quest creators to see the full history.

#### Quest Status Logic
When a participant is kicked and no approved participants remain:
- Automatically update quest status from 'in-progress' to 'open'
- Update quest's `participants_count` field
- Send appropriate notifications if configured

### 6. Response Examples

#### Successful Kick Response:
```json
{
  "id": 123,
  "status": "kicked",
  "quest": {
    "id": 456,
    "title": "Design a Logo",
    "status": "open"  // Reverted to open if no participants remain
  },
  "applicant": {
    "id": 789,
    "username": "designer123"
  },
  "applied_at": "2025-01-01T12:00:00Z",
  "reviewed_at": "2025-01-01T15:00:00Z",
  "reviewed_by": {
    "id": 101,
    "username": "quest_creator"
  },
  "kick_reason": "Did not meet quality standards"
}
```

### 7. Migration Considerations
- Existing applications with removed/deleted status should be migrated appropriately
- Ensure backward compatibility with existing API consumers
- Update API documentation and OpenAPI specifications

## Frontend Integration Notes
The frontend has been updated to:
- Display kicked status with orange color scheme
- Prevent kicked users from re-applying
- Show appropriate messages for kicked participants
- Update quest status when participants are kicked
- Preserve application history for audit purposes

## Testing Requirements
1. Test kicking the last participant reverts quest status to 'open'
2. Test kicked participants cannot access quest functionality
3. Test kicked participants cannot re-apply
4. Test quest creator permissions
5. Test application history preservation
6. Test edge cases (kicking from completed quests, etc.)
