from django.db import models
from quests.models import Quest

class QuestGoldReservation(models.Model):
    """
    Tracks gold reserved for quests, ensuring quest creators can't exceed their balance
    """
    quest = models.OneToOneField(Quest, on_delete=models.CASCADE, related_name='gold_reservation')
    amount = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=0.00,
        help_text='Reserved gold amount'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Gold Reservation: {self.amount} for Quest {self.quest.id}"
