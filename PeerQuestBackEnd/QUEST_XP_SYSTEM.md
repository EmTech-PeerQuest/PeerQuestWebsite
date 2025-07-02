# Quest Difficulty & XP Reward System

## Overview
The quest system now automatically ties difficulty levels to XP rewards, ensuring consistent and fair rewards across all quests.

## Difficulty → XP Mapping

| Difficulty | XP Reward | Description |
|------------|-----------|-------------|
| **Easy** | 50 XP | Perfect for beginners |
| **Medium** | 75 XP | Moderate challenge |
| **Hard** | 150 XP | Challenging tasks |

## How It Works

### Automatic XP Assignment
- When creating or editing a quest, the XP reward is **automatically set** based on the selected difficulty
- Users can slide the difficulty slider in the frontend, and the XP reward updates automatically
- The system prevents manual XP override to maintain consistency

### Quest Creation Flow
1. User selects difficulty level using the slider interface
2. System automatically assigns appropriate XP reward
3. Quest is saved with the correct XP amount
4. When quest is completed, participants receive the XP reward automatically

### Quest Completion & XP Award
- When a quest is marked as completed, all participants automatically receive XP
- XP is added to the user's total and level is recalculated
- Level-up notifications are triggered if applicable

## Backend Implementation

### Model Changes
```python
# In quests/models.py
class Quest(models.Model):
    DIFFICULTY_XP_MAPPING = {
        'easy': 50,
        'medium': 75,
        'hard': 150,
    }
    
    # XP is automatically set in save() method
    def save(self, *args, **kwargs):
        if self.difficulty in self.DIFFICULTY_XP_MAPPING:
            self.xp_reward = self.DIFFICULTY_XP_MAPPING[self.difficulty]
        super().save(*args, **kwargs)
```

### Automatic XP Award
- Django signals automatically award XP when quests are completed
- XP calculation and level progression handled in `xp/utils.py`
- Users receive XP based on quest difficulty level

### Admin Interface
- XP reward field is now **read-only** in Django admin
- Admin action available to update existing quests to new XP system
- Clear indication that XP rewards are automatically set

## Management Commands

### Update Existing Quests
```bash
# Dry run to see what would be updated
python manage.py update_quest_xp --dry-run

# Apply the updates
python manage.py update_quest_xp
```

## Frontend Integration

### Difficulty Slider
The frontend difficulty slider (as shown in the screenshot) works perfectly with this system:
- User slides to select difficulty
- Frontend shows corresponding XP reward (e.g., "75 XP Reward" for Medium)
- Backend automatically sets the correct XP amount when quest is saved

### Quest Display
- Quest cards show both difficulty level and XP reward
- XP rewards are consistent across all quests of the same difficulty
- Users can trust that difficulty accurately reflects reward

## Benefits

### For Users
- ✅ **Consistent rewards** - Same difficulty = Same XP
- ✅ **Fair progression** - Clear understanding of effort vs reward
- ✅ **Automatic leveling** - XP awarded automatically on completion

### For Administrators
- ✅ **No manual XP management** - System handles everything
- ✅ **Easy updates** - Management command updates existing quests
- ✅ **Consistent experience** - All quests follow same rules

### For Developers
- ✅ **Single source of truth** - XP mapping defined in one place
- ✅ **Automatic calculations** - No manual XP assignment needed
- ✅ **Extensible system** - Easy to add new difficulty levels

## Testing

### Verify XP Assignment
1. Create a new quest with each difficulty level
2. Verify XP rewards are automatically set correctly
3. Complete quests and verify XP is awarded to participants

### Update Existing Quests
1. Run `python manage.py update_quest_xp --dry-run`
2. Review the proposed changes
3. Run `python manage.py update_quest_xp` to apply

## Future Enhancements

### Possible Additions
- **Bonus XP multipliers** for guild members
- **Streak bonuses** for consecutive quest completions
- **Time-based bonuses** for quick completion
- **Additional difficulty levels** (e.g., Expert, Master)

### Configuration
The XP mapping could be moved to Django settings for easier configuration:
```python
# In settings.py
QUEST_DIFFICULTY_XP_MAPPING = {
    'easy': 50,
    'medium': 75,
    'hard': 150,
}
```

## Troubleshooting

### Common Issues
1. **Existing quests have wrong XP** → Run `update_quest_xp` command
2. **XP not awarded on completion** → Check Django signals are working
3. **Frontend shows wrong XP** → Verify difficulty-XP mapping matches backend

### Logging
The system logs XP awards and level-ups for debugging purposes.
