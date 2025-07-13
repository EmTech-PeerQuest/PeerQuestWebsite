# XP Reward System Based on Quest Difficulty

This system automatically ties quest difficulty levels to XP rewards, ensuring consistent rewards across the platform.

## Difficulty-XP Mapping

| Difficulty | XP Reward | Description |
|------------|-----------|-------------|
| **Easy**   | 50 XP     | Simple tasks, beginner-friendly |
| **Medium** | 75 XP     | Moderate challenge, requires some skill |
| **Hard**   | 150 XP    | Complex tasks, expert-level |

## Features

### Automatic XP Assignment
- When creating or editing a quest, the XP reward is automatically set based on the selected difficulty
- No manual intervention required - the system maintains consistency

### Database Migration Support
- Management command to update existing quests: `python manage.py update_quest_xp`
- Admin action to bulk update selected quests
- Class method `Quest.update_xp_rewards_by_difficulty()` for programmatic updates

### Admin Interface Enhancements
- XP reward field is now read-only (automatically calculated)
- Visual indication that XP is tied to difficulty
- Bulk action to update existing quest XP rewards
- Description showing the mapping in the admin interface

### XP Utility Functions
Located in `xp/utils.py`:

```python
from xp.utils import award_xp, calculate_level, get_difficulty_xp_reward

# Award XP to a user
result = award_xp(user, 75, "Quest completion")

# Calculate user level from XP
level = calculate_level(user.xp)

# Get XP reward for a difficulty
xp = get_difficulty_xp_reward('medium')  # Returns 75
```

### Automatic XP Awarding
- Django signals automatically award XP when quests are completed
- Participants receive XP when their status changes to 'completed'
- Level-up detection and handling included

### Quest Completion Method
```python
# Complete a quest and award XP to all participants
result = quest.complete_quest("All objectives met")
```

## Usage Examples

### Creating a Quest
```python
quest = Quest.objects.create(
    title="Design a Logo",
    difficulty="medium",  # XP reward automatically set to 75
    # ... other fields
)
```

### Updating Existing Quests
```bash
# Dry run to see what would change
python manage.py update_quest_xp --dry-run

# Apply changes
python manage.py update_quest_xp
```

### Admin Interface
1. Navigate to Quests in Django admin
2. Select quests you want to update
3. Choose "Update XP rewards based on difficulty" action
4. Execute action

## Implementation Details

### Model Changes
- Added `DIFFICULTY_XP_MAPPING` class attribute to Quest model
- Modified `save()` method to auto-set XP rewards
- Added utility methods for XP management

### Signal Handlers
- `auto_set_xp_reward`: Sets XP on quest save
- `award_xp_on_quest_completion`: Awards XP when participants complete quests
- `handle_quest_completion`: Manages quest completion workflow

### Management Commands
- `update_quest_xp`: Updates existing quests with proper XP rewards
- `test_xp_system`: Tests the XP system functionality

## Customization

To modify the XP rewards, update the `DIFFICULTY_XP_MAPPING` in `quests/models.py`:

```python
DIFFICULTY_XP_MAPPING = {
    'easy': 60,    # Changed from 50
    'medium': 90,  # Changed from 75
    'hard': 180,   # Changed from 150
}
```

Then run the update command to apply changes to existing quests.

## Benefits

1. **Consistency**: All quests of the same difficulty award the same XP
2. **Automation**: No manual XP assignment needed
3. **Scalability**: Easy to update all quests when balancing rewards
4. **Transparency**: Clear mapping visible to users and administrators
5. **Maintainability**: Centralized reward logic in one place

## Migration Path

For existing installations:

1. Apply database migrations (if any)
2. Run `python manage.py update_quest_xp` to update existing quests
3. Verify changes in admin interface
4. Test quest creation and completion workflows
