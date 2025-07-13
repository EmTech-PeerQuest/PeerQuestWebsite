# Application Attempt System Implementation

## Overview
Implemented a new system that allows kicked users to re-apply unlimited times while limiting rejected users to 3 re-application attempts (4 total attempts including the initial application).

## Backend Changes

### 1. New Model: ApplicationAttempt
**File:** `applications/models.py`

Created a new model to track application attempts:
```python
class ApplicationAttempt(models.Model):
    quest = models.ForeignKey('quests.Quest', ...)
    applicant = models.ForeignKey(settings.AUTH_USER_MODEL, ...)
    application = models.ForeignKey(Application, ...)
    attempt_number = models.PositiveIntegerField(...)
    timestamp = models.DateTimeField(auto_now_add=True)
```

**Key Features:**
- Tracks sequential attempt numbers for each user/quest combination
- Automatic recording when new applications are created
- Provides methods for checking eligibility and attempt counts

### 2. Updated Application Rules
**File:** `applications/models.py`

**New Application Rules:**
- ✅ **Kicked users**: Can re-apply **unlimited times**
- ✅ **Rejected users**: Can re-apply **3 more times** (4 total attempts)
- ❌ **Pending applications**: Cannot apply again until resolved
- ❌ **Approved participants**: Cannot apply again

**Implementation Methods:**
- `ApplicationAttempt.can_apply_again(quest, applicant)` - Check eligibility
- `ApplicationAttempt.get_attempt_count(quest, applicant)` - Count attempts
- `ApplicationAttempt.record_attempt(application)` - Record new attempt

### 3. Updated Validation Logic
**File:** `applications/models.py`

Modified `Application.clean()` method:
```python
def clean(self):
    # ... existing pending check ...
    
    # New: Check application attempt limits
    can_apply, reason = ApplicationAttempt.can_apply_again(self.quest, self.applicant)
    if not can_apply:
        raise ValidationError(reason)
```

### 4. Automatic Attempt Recording
**File:** `applications/models.py`

Modified `Application.save()` method:
```python
def save(self, *args, **kwargs):
    self.clean()
    is_new = self.pk is None
    super().save(*args, **kwargs)
    
    # Record application attempt when creating new application
    if is_new and self.status == 'pending':
        ApplicationAttempt.record_attempt(self)
```

### 5. Database Migration
**File:** `applications/migrations/0005_applicationattempt.py`

Created migration for the new ApplicationAttempt model with:
- Proper foreign key relationships
- Unique constraints for quest/applicant/attempt_number
- Database indexes for performance

## Frontend Changes

### 1. Updated Quest Details Modal
**File:** `components/quests/quest-details-modal.tsx`

**New Application Eligibility Logic:**
```tsx
const getApplicationEligibility = () => {
    // ... eligibility checks ...
    
    // Kicked users can re-apply unlimited times
    if (hasBeenKicked) {
        return { canApply: true, reason: "Can re-apply after being kicked" }
    }
    
    // Rejected users can re-apply (server enforces limits)
    if (hasRejectedApplication) {
        return { canApply: true, reason: "Can re-apply after rejection" }
    }
    
    return { canApply: true, reason: "Can apply" }
}
```

**Updated UI Elements:**
- Apply button now uses new eligibility system
- Kicked user message updated: "You can re-apply if you wish to participate again"
- Button text changes: "Re-apply to Quest" for kicked users

### 2. Updated Quest Management
**File:** `components/quests/quest-management.tsx`

**Participation Logic:**
- Kicked users who re-apply and get approved will show up in "Participating" tab again
- Updated comment: "Include if user is participating AND has not been kicked OR has an active approved application"

## Testing Results

### Test Scenarios Verified:

#### 1. Rejected User Limits (✅ Working)
- **Attempt 1-4**: Allowed and recorded
- **Attempt 5**: Correctly blocked with message "Maximum application attempts (4) reached for this quest"

#### 2. Kicked User Unlimited Attempts (✅ Working)
- **Attempts 1-5+**: All allowed
- Message: "Can re-apply (kicked users have unlimited attempts)"

#### 3. Application Attempt Tracking (✅ Working)
- Automatic recording of attempts when applications are created
- Proper counting and validation
- Database constraints prevent duplicate attempts

## Error Handling

### Validation Messages:
- **Pending application**: "You already have a pending application for this quest"
- **Max attempts reached**: "Maximum application attempts (4) reached for this quest"
- **Kicked users**: "Can re-apply (kicked users have unlimited attempts)"
- **Rejected users**: "Can re-apply (X attempts remaining after rejection)"

### Database Constraints:
- Unique constraint on `(quest, applicant, attempt_number)`
- Foreign key constraints ensure data integrity
- Indexes for performance on common queries

## Migration Instructions

1. **Apply Database Migration:**
   ```bash
   python manage.py migrate
   ```

2. **No Data Migration Required:**
   - Existing applications continue to work
   - New attempt tracking starts with new applications
   - Retroactive attempt counting for existing rejected/kicked users

## Summary

✅ **Kicked users**: Can now re-apply unlimited times
✅ **Rejected users**: Limited to 3 re-applications (4 total)
✅ **Attempt tracking**: Comprehensive logging system
✅ **Frontend updated**: Proper UI/UX for new rules
✅ **Database migration**: Applied successfully
✅ **Testing**: All scenarios verified working

The system now provides a fair balance between allowing users to reapply while preventing spam applications from repeatedly rejected users.
