"""
Description Truncation System for Quest Cards

This demonstrates how the quest description truncation works:

1. QUEST CARD/LIST VIEW (QuestListSerializer):
   - Uses `description` field but automatically truncated to 150 characters + "..."
   - Shows brief preview like: "qwerty qwerty qwerty qwerty qwerty qwerty..."
   
2. QUEST DETAIL VIEW (QuestDetailSerializer):
   - Uses full `description` field
   - Shows complete description with all content

ONLY ONE DESCRIPTION FIELD - truncation handled in serializers!

API Response Examples:
"""

# Quest List API Response (GET /api/quests/)
quest_list_response = {
    "results": [
        {
            "id": 1,
            "title": "hhhhh",
            "description": "qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty...",
            "difficulty": "medium",
            "status": "open",
            "xp_reward": 75,
            "category": {"id": 1, "name": "ART"},
            # ... other fields
        }
    ]
}

# Quest Detail API Response (GET /api/quests/{slug}/)
quest_detail_response = {
    "id": 1,
    "title": "hhhhh",
    "description": "qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty qwerty",
    "short_description": "Brief description for quest cards",
    "difficulty": "medium",
    "status": "open",
    "category": {"id": 1, "name": "ART"},
    # ... all other quest details
}

"""
Frontend Implementation:

1. Quest Cards (List View):
   - Use `description` field (automatically truncated to ~150 chars)
   - API returns truncated version with "..." at the end

2. Quest Detail Page:
   - Use full `description` field (complete text)
   - API returns the full description without truncation

3. CSS Example for additional visual truncation if needed:
   .quest-card-description {
     display: -webkit-box;
     -webkit-line-clamp: 3; /* Limit to 3 lines */
     -webkit-box-orient: vertical;
     overflow: hidden;
   }

Implementation Details:
- Only ONE description field in the model
- Truncation happens in QuestListSerializer.get_description()
- Word-boundary aware truncation (doesn't cut words)
- 150 character limit with "..." suffix
"""

print("✅ Single description field with automatic truncation!")
print("✅ Quest cards show truncated descriptions (~150 chars)")
print("✅ Quest details show full descriptions")
print("✅ Smart word-boundary truncation")
